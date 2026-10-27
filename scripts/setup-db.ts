import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-passwords";

/**
 * Skrip inisialisasi / migrasi enterprise untuk database PostgreSQL / SQLite.
 *
 * Menambahkan tabel `User` dan kolom approval/bukti nota pada tabel `Transaction`
 * secara aman dan idempoten (tanpa menghapus data yang sudah ada).
 */

async function main() {
  const prisma = new PrismaClient();
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isPostgres = dbUrl.startsWith("postgres");

  try {
    console.log(
      `Menyiapkan skema database enterprise (${isPostgres ? "PostgreSQL" : "SQLite"})...`,
    );

    const timestampType = isPostgres ? "TIMESTAMP(3)" : "DATETIME";
    const booleanTrue = isPostgres ? "true" : "1";

    // 1. Buat tabel User jika belum ada
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'STAFF',
        "isActive" BOOLEAN NOT NULL DEFAULT ${booleanTrue},
        "createdAt" ${timestampType} NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" ${timestampType} NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
    `);

    // 2. Tambahkan kolom status & bukti pada tabel Transaction
    const columnsToAdd = [
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "status" TEXT NOT NULL DEFAULT 'APPROVED'`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "proofPath" TEXT`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "proofOriginalName" TEXT`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "proofSize" INTEGER`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "createdById" TEXT`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "approvedById" TEXT`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "approvedAt" ${timestampType}`,
      `ALTER TABLE "Transaction" ADD COLUMN ${isPostgres ? "IF NOT EXISTS" : ""} "rejectionReason" TEXT`,
    ];

    for (const sql of columnsToAdd) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Abaikan jika kolom sudah ada
      }
    }

    // 3. Seed akun default: super admin, admin / admin123, dan staf / staf123
    // Password super admin dibaca dari environment. Kalau kosong, akun super
    // admin DILEWATI (bukan dibuat dengan password bawaan), sehingga akun yang
    // sudah ada di database tidak tertimpa dan tidak ada yang terkunci.
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const superAdminHash = superAdminPassword
      ? hashPassword(superAdminPassword)
      : null;
    const adminHash = hashPassword("admin123");
    const staffHash = hashPassword("staf123");

    if (!superAdminHash) {
      console.warn(
        "SUPER_ADMIN_PASSWORD kosong: akun super admin dilewati. " +
          "Isi variabel itu atau jalankan scripts/create-super-admin.ts.",
      );
    }

    if (isPostgres) {
      if (superAdminHash) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
          VALUES ('user_superadmin', 'Dimas Saputra', 'dimassputra1616@gmail.com', '${superAdminHash}', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("username")
          DO UPDATE SET "passwordHash" = '${superAdminHash}', "name" = 'Dimas Saputra', "role" = 'ADMIN', "isActive" = true;
        `);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
          VALUES ('user_dimas', 'Dimas Saputra', 'dimas', '${superAdminHash}', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("username")
          DO UPDATE SET "passwordHash" = '${superAdminHash}', "name" = 'Dimas Saputra', "role" = 'ADMIN', "isActive" = true;
        `);
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_admin', 'Administrator', 'admin', '${adminHash}', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("username") DO NOTHING;
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_staff', 'Staf Operasional', 'staf', '${staffHash}', 'STAFF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("username") DO NOTHING;
      `);
    } else {
      if (superAdminHash) {
        await prisma.$executeRawUnsafe(`
          INSERT OR REPLACE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
          VALUES ('user_superadmin', 'Dimas Saputra', 'dimassputra1616@gmail.com', '${superAdminHash}', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `);

        await prisma.$executeRawUnsafe(`
          INSERT OR REPLACE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
          VALUES ('user_dimas', 'Dimas Saputra', 'dimas', '${superAdminHash}', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `);
      }

      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_admin', 'Administrator', 'admin', '${adminHash}', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);

      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_staff', 'Staf Operasional', 'staf', '${staffHash}', 'STAFF', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
    }

    console.log("Inisialisasi database enterprise selesai dengan sukses.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Gagal menyiapkan database:", err);
  process.exit(1);
});
