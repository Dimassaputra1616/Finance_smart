import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "../src/lib/auth-passwords";

/**
 * Skrip migrasi data dari SQLite (prisma/dev.db) ke PostgreSQL.
 *
 * Menggunakan modul bawaan Node 22 `node:sqlite` untuk membaca data SQLite lama,
 * lalu menuliskan seluruh entitas ke PostgreSQL melalui Prisma Client.
 */

const SQLITE_PATH = resolve(process.cwd(), "prisma", "dev.db");

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    return new Date(val < 10000000000 ? val * 1000 : val);
  }
  if (typeof val === "string") {
    if (/^\d+$/.test(val)) {
      const num = Number(val);
      return new Date(num < 10000000000 ? num * 1000 : num);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (val instanceof Date) return val;
  return null;
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") return val === "1" || val.toLowerCase() === "true";
  return false;
}

type SqliteAccountRow = {
  id: string;
  name: string;
  type: string;
  purpose?: string | null;
  initialBalance?: number | string | null;
  isArchived?: number | boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqliteCategoryRow = {
  id: string;
  name: string;
  kind: string;
  color?: string | null;
  isArchived?: number | boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqliteUserRow = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role?: string | null;
  isActive?: number | boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqliteTransactionRow = {
  id: string;
  occurredAt?: string | number | null;
  amount: number | string;
  kind: string;
  description: string;
  notes?: string | null;
  accountId: string;
  categoryId: string;
  status?: string | null;
  proofPath?: string | null;
  proofOriginalName?: string | null;
  proofSize?: number | string | null;
  createdById?: string | null;
  approvedById?: string | null;
  approvedAt?: string | number | null;
  rejectionReason?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqliteTransferRow = {
  id: string;
  amount: number | string;
  occurredAt?: string | number | null;
  notes?: string | null;
  fromAccountId: string;
  toAccountId: string;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqliteReceivableRow = {
  id: string;
  personName: string;
  title: string;
  amount: number | string;
  lentAt?: string | number | null;
  dueAt?: string | number | null;
  notes?: string | null;
  isCancelled?: number | boolean | null;
  lentTransactionId?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

type SqlitePaymentRow = {
  id: string;
  receivableId: string;
  amount: number | string;
  receivedAt?: string | number | null;
  notes?: string | null;
  transactionId?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
};

async function main() {
  if (!existsSync(SQLITE_PATH)) {
    throw new Error(`File SQLite tidak ditemukan di: ${SQLITE_PATH}`);
  }

  console.log("=== Memulai Migrasi SQLite -> PostgreSQL ===");
  console.log(`Sumber SQLite : ${SQLITE_PATH}`);
  console.log(`Target Postgres: ${process.env.DATABASE_URL}`);

  const sqlite = new DatabaseSync(SQLITE_PATH);
  const prisma = new PrismaClient();

  try {
    // Cek tabel apa saja yang ada di SQLite
    const tablesRaw = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
      )
      .all() as Array<{ name: string }>;
    const tableNames = new Set(tablesRaw.map((t) => t.name));
    console.log("Tabel ditemukan di SQLite:", Array.from(tableNames).join(", "));

    // 1. Akun (Account)
    if (tableNames.has("Account")) {
      const accounts = sqlite
        .prepare('SELECT * FROM "Account"')
        .all() as unknown as SqliteAccountRow[];
      console.log(`\n[1/7] Migrasi Akun (${accounts.length} baris)...`);
      for (const a of accounts) {
        await prisma.account.upsert({
          where: { id: a.id },
          update: {
            name: a.name,
            type: a.type,
            purpose: a.purpose ?? null,
            initialBalance: Number(a.initialBalance ?? 0),
            isArchived: parseBool(a.isArchived),
            updatedAt: parseDate(a.updatedAt) ?? new Date(),
          },
          create: {
            id: a.id,
            name: a.name,
            type: a.type,
            purpose: a.purpose ?? null,
            initialBalance: Number(a.initialBalance ?? 0),
            isArchived: parseBool(a.isArchived),
            createdAt: parseDate(a.createdAt) ?? new Date(),
            updatedAt: parseDate(a.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${accounts.length} Akun berhasil dimigrasi.`);
    }

    // 2. Kategori (Category)
    if (tableNames.has("Category")) {
      const categories = sqlite
        .prepare('SELECT * FROM "Category"')
        .all() as unknown as SqliteCategoryRow[];
      console.log(`\n[2/7] Migrasi Kategori (${categories.length} baris)...`);
      for (const c of categories) {
        await prisma.category.upsert({
          where: { id: c.id },
          update: {
            name: c.name,
            kind: c.kind,
            color: c.color ?? "#64748b",
            isArchived: parseBool(c.isArchived),
            updatedAt: parseDate(c.updatedAt) ?? new Date(),
          },
          create: {
            id: c.id,
            name: c.name,
            kind: c.kind,
            color: c.color ?? "#64748b",
            isArchived: parseBool(c.isArchived),
            createdAt: parseDate(c.createdAt) ?? new Date(),
            updatedAt: parseDate(c.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${categories.length} Kategori berhasil dimigrasi.`);
    }

    // 3. User (User RBAC)
    if (tableNames.has("User")) {
      const users = sqlite
        .prepare('SELECT * FROM "User"')
        .all() as unknown as SqliteUserRow[];
      console.log(`\n[3/7] Migrasi User (${users.length} baris)...`);
      for (const u of users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            name: u.name,
            username: u.username,
            passwordHash: u.passwordHash,
            role: u.role ?? "STAFF",
            isActive: parseBool(u.isActive),
            updatedAt: parseDate(u.updatedAt) ?? new Date(),
          },
          create: {
            id: u.id,
            name: u.name,
            username: u.username,
            passwordHash: u.passwordHash,
            role: u.role ?? "STAFF",
            isActive: parseBool(u.isActive),
            createdAt: parseDate(u.createdAt) ?? new Date(),
            updatedAt: parseDate(u.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${users.length} User berhasil dimigrasi.`);
    } else {
      console.log("\n[3/7] Membuat User default (admin & staf)...");
      await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
          id: "user_admin",
          name: "Administrator",
          username: "admin",
          passwordHash: hashPassword("admin123"),
          role: "ADMIN",
        },
      });
      await prisma.user.upsert({
        where: { username: "staf" },
        update: {},
        create: {
          id: "user_staff",
          name: "Staf Operasional",
          username: "staf",
          passwordHash: hashPassword("staf123"),
          role: "STAFF",
        },
      });
      console.log("  ✓ User default admin & staf berhasil disiapkan.");
    }

    // 4. Transaksi (Transaction)
    if (tableNames.has("Transaction")) {
      const transactions = sqlite
        .prepare('SELECT * FROM "Transaction"')
        .all() as unknown as SqliteTransactionRow[];
      console.log(`\n[4/7] Migrasi Transaksi (${transactions.length} baris)...`);
      for (const t of transactions) {
        await prisma.transaction.upsert({
          where: { id: t.id },
          update: {
            occurredAt: parseDate(t.occurredAt) ?? new Date(),
            amount: Number(t.amount),
            kind: t.kind,
            description: t.description,
            notes: t.notes ?? null,
            accountId: t.accountId,
            categoryId: t.categoryId,
            status: t.status ?? "APPROVED",
            proofPath: t.proofPath ?? null,
            proofOriginalName: t.proofOriginalName ?? null,
            proofSize: t.proofSize != null ? Number(t.proofSize) : null,
            createdById: t.createdById ?? null,
            approvedById: t.approvedById ?? null,
            approvedAt: parseDate(t.approvedAt),
            rejectionReason: t.rejectionReason ?? null,
            updatedAt: parseDate(t.updatedAt) ?? new Date(),
          },
          create: {
            id: t.id,
            occurredAt: parseDate(t.occurredAt) ?? new Date(),
            amount: Number(t.amount),
            kind: t.kind,
            description: t.description,
            notes: t.notes ?? null,
            accountId: t.accountId,
            categoryId: t.categoryId,
            status: t.status ?? "APPROVED",
            proofPath: t.proofPath ?? null,
            proofOriginalName: t.proofOriginalName ?? null,
            proofSize: t.proofSize != null ? Number(t.proofSize) : null,
            createdById: t.createdById ?? null,
            approvedById: t.approvedById ?? null,
            approvedAt: parseDate(t.approvedAt),
            rejectionReason: t.rejectionReason ?? null,
            createdAt: parseDate(t.createdAt) ?? new Date(),
            updatedAt: parseDate(t.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${transactions.length} Transaksi berhasil dimigrasi.`);
    }

    // 5. Transfer Antar Akun (Transfer)
    if (tableNames.has("Transfer")) {
      const transfers = sqlite
        .prepare('SELECT * FROM "Transfer"')
        .all() as unknown as SqliteTransferRow[];
      console.log(`\n[5/7] Migrasi Transfer (${transfers.length} baris)...`);
      for (const tr of transfers) {
        await prisma.transfer.upsert({
          where: { id: tr.id },
          update: {
            amount: Number(tr.amount),
            occurredAt: parseDate(tr.occurredAt) ?? new Date(),
            notes: tr.notes ?? null,
            fromAccountId: tr.fromAccountId,
            toAccountId: tr.toAccountId,
            updatedAt: parseDate(tr.updatedAt) ?? new Date(),
          },
          create: {
            id: tr.id,
            amount: Number(tr.amount),
            occurredAt: parseDate(tr.occurredAt) ?? new Date(),
            notes: tr.notes ?? null,
            fromAccountId: tr.fromAccountId,
            toAccountId: tr.toAccountId,
            createdAt: parseDate(tr.createdAt) ?? new Date(),
            updatedAt: parseDate(tr.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${transfers.length} Transfer berhasil dimigrasi.`);
    }

    // 6. Piutang (Receivable)
    if (tableNames.has("Receivable")) {
      const receivables = sqlite
        .prepare('SELECT * FROM "Receivable"')
        .all() as unknown as SqliteReceivableRow[];
      console.log(`\n[6/7] Migrasi Piutang (${receivables.length} baris)...`);
      for (const r of receivables) {
        await prisma.receivable.upsert({
          where: { id: r.id },
          update: {
            personName: r.personName,
            title: r.title,
            amount: Number(r.amount),
            lentAt: parseDate(r.lentAt) ?? new Date(),
            dueAt: parseDate(r.dueAt),
            notes: r.notes ?? null,
            isCancelled: parseBool(r.isCancelled),
            lentTransactionId: r.lentTransactionId ?? null,
            updatedAt: parseDate(r.updatedAt) ?? new Date(),
          },
          create: {
            id: r.id,
            personName: r.personName,
            title: r.title,
            amount: Number(r.amount),
            lentAt: parseDate(r.lentAt) ?? new Date(),
            dueAt: parseDate(r.dueAt),
            notes: r.notes ?? null,
            isCancelled: parseBool(r.isCancelled),
            lentTransactionId: r.lentTransactionId ?? null,
            createdAt: parseDate(r.createdAt) ?? new Date(),
            updatedAt: parseDate(r.updatedAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${receivables.length} Piutang berhasil dimigrasi.`);
    }

    // 7. Pembayaran Piutang (ReceivablePayment)
    if (tableNames.has("ReceivablePayment")) {
      const payments = sqlite
        .prepare('SELECT * FROM "ReceivablePayment"')
        .all() as unknown as SqlitePaymentRow[];
      console.log(`\n[7/7] Migrasi Pembayaran Piutang (${payments.length} baris)...`);
      for (const p of payments) {
        await prisma.receivablePayment.upsert({
          where: { id: p.id },
          update: {
            receivableId: p.receivableId,
            amount: Number(p.amount),
            receivedAt: parseDate(p.receivedAt) ?? new Date(),
            notes: p.notes ?? null,
            transactionId: p.transactionId ?? null,
          },
          create: {
            id: p.id,
            receivableId: p.receivableId,
            amount: Number(p.amount),
            receivedAt: parseDate(p.receivedAt) ?? new Date(),
            notes: p.notes ?? null,
            transactionId: p.transactionId ?? null,
            createdAt: parseDate(p.createdAt) ?? new Date(),
          },
        });
      }
      console.log(`  ✓ ${payments.length} Pembayaran Piutang berhasil dimigrasi.`);
    }

    console.log("\n=== MIGRASI SELESAI DENGAN SUKSES! ===");
    console.log("Ringkasan data di PostgreSQL:");
    console.log("  Total Akun     :", await prisma.account.count());
    console.log("  Total Kategori :", await prisma.category.count());
    console.log("  Total User     :", await prisma.user.count());
    console.log("  Total Transaksi:", await prisma.transaction.count());
    console.log("  Total Transfer :", await prisma.transfer.count());
    console.log("  Total Piutang  :", await prisma.receivable.count());
    console.log("  Total Bayar Ptg:", await prisma.receivablePayment.count());
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Migrasi gagal:", err);
  process.exit(1);
});
