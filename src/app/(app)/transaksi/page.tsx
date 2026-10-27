import Link from "next/link";
import {
  getActiveAccounts,
  getActiveCategories,
  getTransactions,
  getPendingSummary,
} from "@/server/queries/finance";
import {
  formatDateShort,
  formatMonthLabel,
  normalizeMonthKey,
} from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { getCurrentUser } from "@/lib/session";
import {
  TRANSACTION_KINDS,
  TRANSACTION_KIND_LABELS,
  isTransactionKind,
  isTransactionStatus,
  type TransactionKind,
} from "@/lib/types";
import { IconDownload, IconPencil, IconPlus, IconSearch } from "@/components/Icons";
import {
  Card,
  EmptyState,
  FormField,
  Input,
  Select,
  buttonStyles,
  cx,
} from "@/components/ui";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";
import { ViewProofButton } from "@/components/transactions/ViewProofButton";
import { ApprovalActions } from "@/components/transactions/ApprovalActions";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Susun query string sambil mempertahankan filter yang lain. */
function buildHref(base: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const monthKey = normalizeMonthKey(first(params.bulan));
  const kindParam = first(params.jenis);
  const kind = isTransactionKind(kindParam)
    ? (kindParam as TransactionKind)
    : undefined;
  const statusParam = first(params.status);
  const status = isTransactionStatus(statusParam) ? statusParam : undefined;

  const categoryId = first(params.kategori) || undefined;
  const accountId = first(params.akun) || undefined;
  const keyword = first(params.q) || undefined;
  const page = Math.max(1, Number.parseInt(first(params.halaman), 10) || 1);

  const [result, accounts, categories, currentUser, pendingSummary] =
    await Promise.all([
      getTransactions({
        monthKey,
        kind,
        status,
        categoryId,
        accountId,
        keyword,
        page,
      }),
      getActiveAccounts(),
      getActiveCategories(),
      getCurrentUser(),
      getPendingSummary(),
    ]);

  const isAdmin = currentUser?.role === "ADMIN";

  const activeFilters = {
    bulan: monthKey,
    jenis: kindParam,
    status: statusParam,
    kategori: categoryId ?? "",
    akun: accountId ?? "",
    q: keyword ?? "",
  };

  const exportHref = buildHref("/api/export/transaksi", activeFilters);

  const pageIncome = result.items.reduce(
    (sum, item) => (item.kind === "INCOME" ? sum + item.amount : sum),
    0,
  );
  const pageExpense = result.items.reduce(
    (sum, item) => (item.kind === "EXPENSE" ? sum + item.amount : sum),
    0,
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">
            Riwayat & Persetujuan
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Transaksi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMonthLabel(monthKey)} · {result.total} transaksi ditemukan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Ekspor Dual Format: Excel Berformat (Tabel) & CSV Mentah */}
          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-2xs">
            <a
              href={`${exportHref}`}
              download
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-hover hover:text-primary cursor-pointer"
              title="Unduh laporan kas berformat tabel dan bergaris (Microsoft Excel / Google Sheets)"
            >
              <IconDownload className="h-3.5 w-3.5 text-primary" />
              <span>Excel</span>
            </a>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <a
              href={`${exportHref}${exportHref.includes("?") ? "&" : "?"}format=csv`}
              download
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-surface-hover hover:text-foreground cursor-pointer"
              title="Unduh data teks mentah (CSV)"
            >
              <span>CSV</span>
            </a>
          </div>

          <Link href="/transaksi/baru" className={buttonStyles("primary", "md")}>
            <IconPlus className="h-4 w-4" />
            Catat transaksi
          </Link>
        </div>
      </header>

      {/* Tab Filter Status Persetujuan */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Link
          href={buildHref("/transaksi", {
            ...activeFilters,
            status: undefined,
            halaman: undefined,
          })}
          className={cx(
            "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition",
            !status
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-surface-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Semua Transaksi
        </Link>
        <Link
          href={buildHref("/transaksi", {
            ...activeFilters,
            status: "PENDING",
            halaman: undefined,
          })}
          className={cx(
            "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition",
            status === "PENDING"
              ? "bg-warning text-warning-foreground shadow-xs font-semibold"
              : "bg-warning-soft text-warning hover:bg-warning/20",
          )}
        >
          Menunggu Persetujuan
          {pendingSummary.count > 0 && (
            <span className="rounded-full bg-warning px-1.5 py-0.5 text-[0.7rem] font-bold text-warning-foreground">
              {pendingSummary.count}
            </span>
          )}
        </Link>
        <Link
          href={buildHref("/transaksi", {
            ...activeFilters,
            status: "APPROVED",
            halaman: undefined,
          })}
          className={cx(
            "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition",
            status === "APPROVED"
              ? "bg-income text-income-foreground shadow-xs font-semibold"
              : "bg-surface-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Disetujui
        </Link>
        <Link
          href={buildHref("/transaksi", {
            ...activeFilters,
            status: "REJECTED",
            halaman: undefined,
          })}
          className={cx(
            "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition",
            status === "REJECTED"
              ? "bg-destructive text-destructive-foreground shadow-xs font-semibold"
              : "bg-surface-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Ditolak
        </Link>
      </div>

      <Card className="p-5">
        <form
          method="get"
          action="/transaksi"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}

          <FormField label="Bulan" htmlFor="bulan">
            <Input
              id="bulan"
              name="bulan"
              type="month"
              defaultValue={monthKey}
            />
          </FormField>

          <FormField label="Jenis" htmlFor="jenis">
            <Select id="jenis" name="jenis" defaultValue={kindParam}>
              <option value="">Semua jenis</option>
              {TRANSACTION_KINDS.map((option) => (
                <option key={option} value={option}>
                  {TRANSACTION_KIND_LABELS[option]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Kategori" htmlFor="kategori">
            <Select
              id="kategori"
              name="kategori"
              defaultValue={categoryId ?? ""}
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Akun" htmlFor="akun">
            <Select id="akun" name="akun" defaultValue={accountId ?? ""}>
              <option value="">Semua akun</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Cari keterangan"
            htmlFor="q"
            className="lg:col-span-2"
          >
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
              <Input
                id="q"
                name="q"
                type="search"
                placeholder="Kata kunci pada keterangan"
                defaultValue={keyword ?? ""}
                className="pl-10"
              />
            </div>
          </FormField>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className={buttonStyles("primary", "sm")}>
              <IconSearch className="h-4 w-4" />
              Terapkan filter
            </button>
            <Link href="/transaksi" className={buttonStyles("secondary", "sm")}>
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5 text-sm">
          <p className="text-muted-foreground">
            Pada halaman ini: pemasukan{" "}
            <span className="font-semibold tabular-nums text-income">
              {formatRupiah(pageIncome)}
            </span>
            <span className="mx-1.5 text-subtle-foreground">·</span>
            pengeluaran{" "}
            <span className="font-semibold tabular-nums text-expense">
              {formatRupiah(pageExpense)}
            </span>
          </p>
          <p className="text-xs text-subtle-foreground">
            Halaman {result.page} dari {result.totalPages}
          </p>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            title="Tidak ada transaksi yang cocok"
            description="Coba ubah filter, atau catat transaksi baru untuk bulan ini."
            action={
              <Link
                href="/transaksi/baru"
                className={buttonStyles("secondary", "sm")}
              >
                <IconPlus className="h-4 w-4" />
                Catat transaksi
              </Link>
            }
          />
        ) : (
          <>
            {/*
              Layar kecil memakai daftar kartu, bukan tabel.
              Dilengkapi min-w-0 pada setiap flex item agar tidak ada scroll horizontal.
            */}
            <ul className="divide-y divide-border md:hidden">
              {result.items.map((transaction) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tx = transaction as any;
                const txStatus = tx.status ?? "APPROVED";

                return (
                  <li key={transaction.id} className="min-w-0 px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={txStatus} />
                          {tx.proofPath && (
                            <ViewProofButton
                              proofUrl={tx.proofPath}
                              description={transaction.description}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        <p className="mt-0.5 text-xs text-subtle-foreground">
                          {formatDateShort(transaction.occurredAt)}
                          {transaction.notes ? ` · ${transaction.notes}` : ""}
                        </p>
                        {tx.rejectionReason && (
                          <p className="mt-1 text-xs text-destructive">
                            Alasan: {tx.rejectionReason}
                          </p>
                        )}
                      </div>
                      <p
                        className={cx(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          transaction.kind === "INCOME"
                            ? "text-income"
                            : "text-foreground",
                        )}
                      >
                        {transaction.kind === "INCOME" ? "+" : "−"}
                        {formatRupiah(transaction.amount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: transaction.category.color,
                          }}
                        />
                        <span className="truncate">
                          {transaction.category.name} ·{" "}
                          {transaction.account.name}
                        </span>
                      </span>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {/* Aksi Approval untuk Admin */}
                        {isAdmin && txStatus === "PENDING" && (
                          <ApprovalActions
                            transactionId={transaction.id}
                            description={transaction.description}
                          />
                        )}
                        <Link
                          href={`/transaksi/${transaction.id}/edit`}
                          aria-label={`Ubah transaksi ${transaction.description}`}
                          title="Ubah"
                          className={buttonStyles("secondary", "sm")}
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ubah</span>
                        </Link>
                        <DeleteTransactionButton
                          id={transaction.id}
                          description={transaction.description}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Tabel penuh di layar md ke atas */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Tanggal
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Status & Bukti
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Keterangan
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Kategori
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Akun
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">
                      Nominal
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((transaction) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tx = transaction as any;
                    const txStatus = tx.status ?? "APPROVED";

                    return (
                      <tr
                        key={transaction.id}
                        className="transition hover:bg-surface-hover"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {formatDateShort(transaction.occurredAt)}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={txStatus} />
                            {tx.proofPath && (
                              <ViewProofButton
                                proofUrl={tx.proofPath}
                                description={transaction.description}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="font-medium text-foreground">
                            {transaction.description}
                          </p>
                          {transaction.notes ? (
                            <p className="mt-0.5 text-xs text-subtle-foreground">
                              {transaction.notes}
                            </p>
                          ) : null}
                          {tx.rejectionReason && (
                            <p className="mt-0.5 text-xs text-destructive">
                              Alasan tolak: {tx.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: transaction.category.color,
                              }}
                            />
                            <span className="text-muted-foreground">
                              {transaction.category.name}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-muted-foreground">
                          {transaction.account.name}
                        </td>
                        <td
                          className={cx(
                            "whitespace-nowrap px-3 py-3.5 text-right font-semibold tabular-nums",
                            transaction.kind === "INCOME"
                              ? "text-income"
                              : "text-foreground",
                          )}
                        >
                          {transaction.kind === "INCOME" ? "+" : "−"}
                          {formatRupiah(transaction.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end items-center gap-2">
                            {isAdmin && txStatus === "PENDING" && (
                              <ApprovalActions
                                transactionId={transaction.id}
                                description={transaction.description}
                              />
                            )}
                            <Link
                              href={`/transaksi/${transaction.id}/edit`}
                              className={buttonStyles("secondary", "sm")}
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                              Ubah
                            </Link>
                            <DeleteTransactionButton
                              id={transaction.id}
                              description={transaction.description}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/35 bg-warning-soft px-2 py-0.5 text-[0.7rem] font-medium text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Menunggu
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/35 bg-destructive-soft px-2 py-0.5 text-[0.7rem] font-medium text-destructive">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Ditolak
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-income/35 bg-income-soft px-2 py-0.5 text-[0.7rem] font-medium text-income">
      <span className="h-1.5 w-1.5 rounded-full bg-income" />
      Disetujui
    </span>
  );
}
