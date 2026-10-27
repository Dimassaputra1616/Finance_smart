import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-passwords";

/**
 * Seed data awal.
 *
 * Idempoten: aman dijalankan berulang karena setiap baris di-upsert lewat
 * unique constraint.
 */

const prisma = new PrismaClient();
// Casting fleksibel agar tsc tidak komplain sebelum `prisma generate` dieksekusi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const EXPENSE_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Operasional Kantor", color: "#6366f1" },
  { name: "Gaji & Upah", color: "#22c55e" },
  { name: "Listrik & Utilitas", color: "#0ea5e9" },
  { name: "Transport & Bensin", color: "#f97316" },
  { name: "ATK & Perlengkapan", color: "#a855f7" },
  { name: "Konsumsi & Snack", color: "#ec4899" },
  { name: "Pajak & Legalitas", color: "#ca8a04" },
  { name: "Piutang", color: "#f43f5e" },
  { name: "Lain-lain", color: "#64748b" },
];

const INCOME_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Pendapatan Proyek", color: "#22c55e" },
  { name: "Penjualan Produk/Jasa", color: "#16a34a" },
  { name: "Investasi / Modal", color: "#ca8a04" },
  { name: "Piutang", color: "#f43f5e" },
  { name: "Lain-lain", color: "#64748b" },
];

async function main() {
  // 1. Kategori
  for (const category of EXPENSE_CATEGORIES) {
    await db.category.upsert({
      where: { name_kind: { name: category.name, kind: "EXPENSE" } },
      update: { color: category.color },
      create: { name: category.name, kind: "EXPENSE", color: category.color },
    });
  }

  for (const category of INCOME_CATEGORIES) {
    await db.category.upsert({
      where: { name_kind: { name: category.name, kind: "INCOME" } },
      update: { color: category.color },
      create: { name: category.name, kind: "INCOME", color: category.color },
    });
  }

  // 2. Akun kas kantor bawaan
  const existingAccount = await db.account.findFirst({
    where: { name: "Kas Operasional" },
  });

  if (!existingAccount) {
    await db.account.create({
      data: { name: "Kas Operasional", type: "TUNAI", initialBalance: 0 },
    });
  }

  // 3. User default RBAC: ADMIN & STAFF
  const adminPasswordHash = hashPassword("admin123");
  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Administrator",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const staffPasswordHash = hashPassword("staf123");
  await db.user.upsert({
    where: { username: "staf" },
    update: {},
    create: {
      name: "Staf Operasional",
      username: "staf",
      passwordHash: staffPasswordHash,
      role: "STAFF",
    },
  });

  const categoryCount = await db.category.count();
  const accountCount = await db.account.count();
  const userCount = await db.user.count();

  console.log(
    `Seed selesai: ${categoryCount} kategori, ${accountCount} akun, ${userCount} user.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
