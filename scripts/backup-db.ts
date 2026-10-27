import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

/**
 * Backup database Keuangan (PostgreSQL & SQLite).
 *
 * Dipakai lewat `npm run db:backup`.
 *
 * - PostgreSQL: Menggunakan utilitas `pg_dump` bawaan sistem untuk membuat dump sql/custom format.
 * - SQLite: Menggunakan `VACUUM INTO` untuk salinan konsisten.
 *
 * Hasil disimpan di `prisma/backups/` dengan nama bercap waktu, dan hanya 10
 * backup terbaru yang dipertahankan supaya folder tidak tumbuh tanpa batas.
 */

const PRISMA_DIR = resolve(process.cwd(), "prisma");
const BACKUP_DIR = resolve(PRISMA_DIR, "backups");
const KEEP_LATEST = 10;

/** Baca `DATABASE_URL` dari environment, lalu fallback ke berkas `.env`. */
function readDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    throw new Error(
      "DATABASE_URL tidak ditemukan di environment maupun berkas .env.",
    );
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*DATABASE_URL\s*=\s*(.+?)\s*$/.exec(line);
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }

  throw new Error("DATABASE_URL tidak ditemukan di berkas .env.");
}

/** Buang backup lama, sisakan `KEEP_LATEST` yang terbaru. */
function pruneOldBackups(): number {
  const files = readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith(".sql") || name.endsWith(".db"))
    // Nama memuat timestamp, jadi urutan leksikografis = urutan waktu.
    .sort();

  const stale = files.slice(0, Math.max(0, files.length - KEEP_LATEST));

  for (const name of stale) {
    try {
      unlinkSync(join(BACKUP_DIR, name));
      console.log(`  membuang backup lama: ${name}`);
    } catch {
      // Abaikan jika gagal hapus
    }
  }

  return stale.length;
}

async function backupPostgres(url: string, destination: string) {
  console.log(`Menjalankan pg_dump untuk database PostgreSQL...`);
  try {
    execSync(`pg_dump --clean --if-exists --no-owner -d "${url}" -f "${destination}"`, {
      stdio: "inherit",
    });
  } catch (err) {
    throw new Error(`Gagal membuat backup dengan pg_dump: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function backupSqlite(url: string, destination: string) {
  const raw = url.slice("file:".length);
  const source = isAbsolute(raw) ? raw : resolve(PRISMA_DIR, raw);

  if (!existsSync(source)) {
    throw new Error(`Berkas database tidak ditemukan: ${source}`);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `VACUUM INTO '${destination.replace(/'/g, "''")}'`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbUrl = readDatabaseUrl();
  const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

  mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ext = isPostgres ? "sql" : "db";
  const destination = join(BACKUP_DIR, `keuangan-${stamp}.${ext}`);

  if (isPostgres) {
    await backupPostgres(dbUrl, destination);
  } else if (dbUrl.startsWith("file:")) {
    await backupSqlite(dbUrl, destination);
  } else {
    throw new Error(`Tipe database pada DATABASE_URL tidak didukung: ${dbUrl}`);
  }

  const { size } = statSync(destination);

  console.log(`Backup selesai`);
  console.log(`  ke    : ${destination}`);
  console.log(`  ukuran: ${(size / 1024).toFixed(1)} KB`);

  const removed = pruneOldBackups();
  if (removed > 0) {
    console.log(`  ${removed} backup lama dibersihkan (sisanya ${KEEP_LATEST}).`);
  }
}

main().catch((error: unknown) => {
  console.error("Backup gagal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
