"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toUtcMidnight } from "@/lib/date";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/session";
import { transactionFormSchema } from "@/lib/validations";
import { actionError, describePrismaError, type ActionResult } from "@/lib/types";
import type { TransactionKind, TransactionStatus } from "@/lib/types";
import { canModifyTransaction } from "@/lib/transaction-rules";
import { formatRupiah } from "@/lib/money";
import { removeProof, saveProof, type SavedProof } from "@/server/proof-storage";
import { addAppNotification } from "@/server/notifications-storage";
import { revalidateFinancePages } from "./revalidate";

function readTransactionForm(formData: FormData) {
  return {
    kind: formData.get("kind"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    notes: formData.get("notes") ?? "",
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
  };
}

/**
 * Ambil dan simpan bukti nota dari form (opsional).
 *
 * Mengembalikan `{ ok: true, proof: null }` bila tidak ada berkas. Bila berkas
 * ada tapi ditolak atau gagal disimpan, hasilnya galat dan pemanggil WAJIB
 * membatalkan penyimpanan transaksi. Dulu galat ini ditelan (`catch` kosong)
 * sehingga transaksi tercatat tanpa bukti dan pengguna tidak diberi tahu.
 */
async function storeProofFromForm(
  formData: FormData,
): Promise<{ ok: true; proof: SavedProof | null } | { ok: false; error: ActionResult }> {
  const file = formData.get("proof");

  if (!file || typeof file !== "object" || !("size" in file) || (file as File).size === 0) {
    return { ok: true, proof: null };
  }

  const saved = await saveProof(file as File);
  if (!saved.ok) {
    return { ok: false, error: actionError(saved.message, { proof: [saved.message] }) };
  }

  return { ok: true, proof: saved.proof };
}

/**
 * Pastikan akun dan kategori ada, aktif, dan jenisnya cocok.
 *
 * Kategori income tidak boleh dipakai pada transaksi expense (dan sebaliknya).
 * Ini dicek di sini, di luar zod, karena memerlukan akses database.
 */
async function validateRelations(
  accountId: string,
  categoryId: string,
  kind: TransactionKind,
  client: Pick<Prisma.TransactionClient, "account" | "category"> = db,
): Promise<ActionResult | null> {
  const [account, category] = await Promise.all([
    client.account.findUnique({
      where: { id: accountId },
      select: { id: true, name: true, isArchived: true },
    }),
    client.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, kind: true, isArchived: true },
    }),
  ]);

  if (!account) {
    return actionError("Akun tidak ditemukan.", { accountId: ["Akun tidak ditemukan."] });
  }

  if (account.isArchived) {
    return actionError(
      `Akun "${account.name}" sudah diarsipkan sehingga tidak bisa dipakai.`,
      { accountId: ["Akun sudah diarsipkan."] },
    );
  }

  if (!category) {
    return actionError("Kategori tidak ditemukan.", {
      categoryId: ["Kategori tidak ditemukan."],
    });
  }

  if (category.kind !== kind) {
    return actionError(
      `Kategori "${category.name}" bukan kategori ${kind === "INCOME" ? "pemasukan" : "pengeluaran"}.`,
      { categoryId: ["Kategori tidak sesuai jenis transaksi."] },
    );
  }

  return null;
}

export async function createTransaction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = transactionFormSchema.safeParse(readTransactionForm(formData));

  if (!parsed.success) {
    return actionError(
      "Periksa kembali isian formulir.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { kind, amount, date, description, notes, accountId, categoryId } = parsed.data;
  const occurredAt = toUtcMidnight(date);

  if (!occurredAt) {
    return actionError("Tanggal tidak valid.", { date: ["Tanggal tidak valid."] });
  }

  // Identifikasi pengguna & penentuan status approval awal.
  // Sesi wajib ada sebelum menulis berkas bukti ke disk. Middleware sudah
  // menolak anonim; ini lapisan kedua.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return actionError("Sesi berakhir. Silakan masuk kembali.");
  }
  const isStaff = currentUser.role === "STAFF";
  // Staf selalu PENDING; Admin otomatis APPROVED
  const status = isStaff ? "PENDING" : "APPROVED";

  const stored = await storeProofFromForm(formData);
  if (!stored.ok) return stored.error;
  const proofData = stored.proof;

  try {
    // Validasi akun & kategori DI DALAM transaksi yang sama dengan penulisan,
    // sesuai aturan check-then-act di `AGENTS.md` §3.1.
    const outcome = await db.$transaction(async (tx) => {
      const relationError = await validateRelations(accountId, categoryId, kind, tx);
      if (relationError) return { status: "error", error: relationError } as const;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txData: any = {
        kind,
        amount,
        occurredAt,
        description,
        notes: notes.length > 0 ? notes : null,
        accountId,
        categoryId,
        status,
        proofPath: proofData?.path ?? null,
        proofOriginalName: proofData?.originalName ?? null,
        proofSize: proofData?.size ?? null,
        createdById: currentUser?.id ?? null,
      };

      if (status === "APPROVED" && currentUser) {
        txData.approvedById = currentUser.id;
        txData.approvedAt = new Date();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any).transaction.create({
        data: txData,
      });

      return { status: "ok" } as const;
    });

    if (outcome.status === "error") {
      // Transaksi tidak tersimpan, jadi berkas bukti yang sudah ditulis dibuang
      // supaya tidak menumpuk tanpa pemilik.
      await removeProof(proofData?.path);
      return outcome.error;
    }
  } catch (error) {
    await removeProof(proofData?.path);
    return actionError(describePrismaError(error));
  }

  // Kirim notifikasi aplikasi internal
  try {
    if (isStaff && status === "PENDING") {
      await addAppNotification({
        title: "Persetujuan Kas Keluar Direktur",
        body: `Staf ${currentUser.name} mengajukan pengeluaran ${formatRupiah(amount)} (${description}). Menunggu persetujuan Direktur.`,
        url: "/transaksi?status=PENDING",
        type: "approval",
        targetRole: "DIRECTOR",
      });
    } else {
      await addAppNotification({
        title: kind === "INCOME" ? "Penerimaan Kas Masuk" : "Pengeluaran Kas Tercatat",
        body: `${formatRupiah(amount)} · ${description}`,
        url: "/transaksi",
        type: "transaction",
      });
    }
  } catch {}

  // `redirect` melempar exception NEXT_REDIRECT, jadi harus DI LUAR blok try
  // agar tidak tertangkap dan dianggap kegagalan.
  revalidateFinancePages();
  redirect("/transaksi");
}

export async function updateTransaction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");

  if (id.length === 0) {
    return actionError("Transaksi tidak valid.");
  }

  const parsed = transactionFormSchema.safeParse(readTransactionForm(formData));

  if (!parsed.success) {
    return actionError(
      "Periksa kembali isian formulir.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { kind, amount, date, description, notes, accountId, categoryId } = parsed.data;
  const occurredAt = toUtcMidnight(date);

  if (!occurredAt) {
    return actionError("Tanggal tidak valid.", { date: ["Tanggal tidak valid."] });
  }

  // Sesi dicek SEBELUM menulis berkas ke disk: hanya pengguna yang login yang
  // boleh menyimpan bukti. Pesannya dikembalikan apa adanya, bukan lewat
  // `describePrismaError` yang akan mengubahnya jadi "Gagal menyimpan data".
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi berakhir. Silakan masuk kembali.");
  }

  const stored = await storeProofFromForm(formData);
  if (!stored.ok) return stored.error;
  const proofData = stored.proof;

  try {
    const outcome = await db.$transaction(async (tx) => {
      // Cek hak akses di dalam transaksi
      const existing = await tx.transaction.findUnique({
        where: { id },
        select: { id: true, status: true, createdById: true, proofPath: true },
      });

      if (!existing) {
        return { status: "error", error: actionError("Transaksi tidak ditemukan.") } as const;
      }

      const check = canModifyTransaction(user, {
        createdById: existing.createdById,
        status: existing.status as TransactionStatus,
      });

      if (!check.allowed) {
        return {
          status: "error",
          error: actionError(check.reason ?? "Akses ditolak."),
        } as const;
      }

      const relationError = await validateRelations(accountId, categoryId, kind, tx);
      if (relationError) return { status: "error", error: relationError } as const;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        kind,
        amount,
        occurredAt,
        description,
        notes: notes.length > 0 ? notes : null,
        accountId,
        categoryId,
      };

      if (proofData) {
        updateData.proofPath = proofData.path;
        updateData.proofOriginalName = proofData.originalName;
        updateData.proofSize = proofData.size;
      }

      await tx.transaction.update({
        where: { id },
        data: updateData,
      });

      return { status: "ok", previousProof: existing.proofPath } as const;
    });

    if (outcome.status === "error") {
      await removeProof(proofData?.path);
      return outcome.error;
    }

    // Bukti diganti: berkas lama sudah tidak dirujuk transaksi mana pun.
    if (proofData) await removeProof(outcome.previousProof);
  } catch (error) {
    await removeProof(proofData?.path);
    return actionError(describePrismaError(error));
  }

  revalidateFinancePages();
  redirect("/transaksi");
}

export async function deleteTransaction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");

  if (id.length === 0) {
    return actionError("Transaksi tidak valid.");
  }

  try {
    const user = await requireUser();

    const existing = await db.transaction.findUnique({
      where: { id },
      select: { createdById: true, status: true, proofPath: true },
    });

    if (!existing) {
      return actionError("Transaksi tidak ditemukan.");
    }

    const check = canModifyTransaction(user, {
      createdById: existing.createdById,
      status: existing.status as TransactionStatus,
    });

    if (!check.allowed) {
      return actionError(check.reason ?? "Akses ditolak.");
    }

    await db.transaction.delete({ where: { id } });

    // Berkas buktinya ikut dibuang agar tidak menumpuk tanpa pemilik.
    await removeProof(existing.proofPath);

    revalidateFinancePages();
    return { ok: true, message: "Transaksi berhasil dihapus." };
  } catch (error) {
    return actionError(describePrismaError(error));
  }
}

/** Setujui pengeluaran/pemasukan staf (Khusus Administrator/Approver). */
export async function approveTransaction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Transaksi tidak valid.");

  try {
    const admin = await requireAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (db as any).transaction.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: admin.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      select: { description: true, amount: true },
    });

    try {
      const approverTitle = admin.role === "DIRECTOR" ? "Direktur" : "Pimpinan";
      await addAppNotification({
        title: "Pengeluaran Disetujui Direktur",
        body: `Transaksi "${updated.description}" (${formatRupiah(updated.amount)}) telah disetujui oleh ${approverTitle} ${admin.name}. Saldo kas telah terpotong.`,
        url: "/transaksi",
        type: "approval",
        targetRole: "ALL",
      });
    } catch {}

    revalidateFinancePages();
    return { ok: true, message: "Transaksi berhasil disetujui." };
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Gagal menyetujui transaksi.",
    );
  }
}

/** Tolak pengeluaran staf dengan alasan (Khusus Administrator/Approver). */
export async function rejectTransaction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) return actionError("Transaksi tidak valid.");

  try {
    const admin = await requireAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (db as any).transaction.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedById: admin.id,
        approvedAt: new Date(),
        rejectionReason: reason || "Ditolak oleh Administrator.",
      },
      select: { description: true, amount: true },
    });

    try {
      const approverTitle = admin.role === "DIRECTOR" ? "Direktur" : "Pimpinan";
      await addAppNotification({
        title: "Pengajuan Ditolak Direktur",
        body: `Pengajuan "${updated.description}" (${formatRupiah(updated.amount)}) ditolak oleh ${approverTitle}: ${reason || "Ditolak oleh Administrator."}`,
        url: "/transaksi",
        type: "approval",
        targetRole: "ALL",
      });
    } catch {}

    revalidateFinancePages();
    return { ok: true, message: "Transaksi ditolak." };
  } catch (error) {
    return actionError(
      error instanceof Error ? error.message : "Gagal menolak transaksi.",
    );
  }
}
