import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-passwords";

/**
 * Skrip pembuatan akun Super Admin.
 */
async function main() {
  const prisma = new PrismaClient();
  const email = "dimassputra1616@gmail.com".toLowerCase().trim();
  // Password dibaca dari environment, tidak pernah ditulis di kode atau repo.
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = "Dimas Saputra";
  const role = "ADMIN";

  if (!password) {
    console.error(
      "SUPER_ADMIN_PASSWORD wajib diisi. Contoh:\n" +
        "  read -rs SUPER_ADMIN_PASSWORD && export SUPER_ADMIN_PASSWORD\n" +
        "  npx tsx scripts/create-super-admin.ts",
    );
    process.exit(1);
  }

  const passwordHash = hashPassword(password);

  console.log(`Menyiapkan akun Super Admin untuk ${email}...`);

  try {
    // 1. Pastikan tabel User ada
    const dbUrl = process.env.DATABASE_URL ?? "";
    const isPostgres = dbUrl.startsWith("postgres");
    const timestampType = isPostgres ? "TIMESTAMP(3)" : "DATETIME";
    const booleanTrue = isPostgres ? "true" : "1";

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

    // 2. Upsert user super admin
    if (isPostgres) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_superadmin', '${name}', '${email}', '${passwordHash}', '${role}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("username")
        DO UPDATE SET "passwordHash" = '${passwordHash}', "name" = '${name}', "role" = '${role}', "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
      `);

      // Tambahkan juga alias username "dimas" dan "dims" agar fleksibel
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_dimas', '${name}', 'dimas', '${passwordHash}', '${role}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("username")
        DO UPDATE SET "passwordHash" = '${passwordHash}', "name" = '${name}', "role" = '${role}', "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
      `);
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT OR REPLACE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_superadmin', '${name}', '${email}', '${passwordHash}', '${role}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);

      await prisma.$executeRawUnsafe(`
        INSERT OR REPLACE INTO "User" ("id", "name", "username", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
        VALUES ('user_dimas', '${name}', 'dimas', '${passwordHash}', '${role}', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
    }

    console.log(`✅ Akun Super Admin berhasil dibuat/diperbarui!`);
    console.log(`   Username : ${email} (atau bisa juga 'dimas')`);
    console.log(`   Role     : ${role} (Super Admin / Approver)`);
  } catch (error) {
    console.error("Gagal membuat user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
