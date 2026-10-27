import "server-only";

import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  checkProofFile,
  isSafeProofFileName,
  sanitizeOriginalName,
  MAX_PROOF_BYTES,
} from "@/lib/proof-rules";

/**
 * Penyimpanan berkas bukti nota.
 *
 * Disimpan DI LUAR `public/`. Berkas di `public/` disajikan langsung oleh
 * Next.js tanpa melewati kode kita, jadi tidak ada tempat untuk memeriksa
 * sesi atau menambah header keamanan. Sekarang berkas hanya bisa dibaca lewat
 * `GET /api/proofs/[file]`, yang mewajibkan login.
 *
 * Catatan operasional: ini menulis ke disk lokal. Di platform dengan
 * filesystem baca-saja (misalnya Vercel) penyimpanan akan gagal dan pengguna
 * mendapat pesan galat, bukan kehilangan bukti secara diam-diam. Untuk
 * deployment seperti itu butuh penyimpanan objek.
 */

const PROOF_DIR = path.join(process.cwd(), "storage", "proofs");

/** Awalan URL yang dipakai `Transaction.proofPath`. */
export const PROOF_URL_PREFIX = "/api/proofs/";

export type SavedProof = { path: string; originalName: string; size: number };

export type SaveProofResult =
  | { ok: true; proof: SavedProof }
  | { ok: false; message: string };

export async function saveProof(file: File): Promise<SaveProofResult> {
  // Ukuran dicek dari metadata dulu supaya berkas raksasa tidak dibaca ke memori.
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false, message: "Ukuran bukti maksimal 5 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = checkProofFile(bytes);
  if (!checked.ok) return checked;

  const fileName = `proof_${Date.now()}_${randomBytes(6).toString("hex")}.${checked.extension}`;

  try {
    await fs.mkdir(PROOF_DIR, { recursive: true });
    // `wx`: gagal bila nama sudah ada, jadi tidak pernah menimpa bukti lain.
    await fs.writeFile(path.join(PROOF_DIR, fileName), bytes, { flag: "wx" });
  } catch {
    return {
      ok: false,
      message: "Bukti nota gagal disimpan di server. Transaksi belum dicatat, coba lagi.",
    };
  }

  return {
    ok: true,
    proof: {
      path: `${PROOF_URL_PREFIX}${fileName}`,
      originalName: sanitizeOriginalName(file.name),
      size: bytes.length,
    },
  };
}

/**
 * Hapus bukti yang baru saja ditulis tapi transaksinya gagal tersimpan.
 * Menerima nilai `proofPath` (`/api/proofs/<nama>`). Nama yang tidak sah atau
 * berkas yang sudah tidak ada diabaikan: ini pembersihan, bukan jalur utama.
 */
export async function removeProof(proofPath: string | null | undefined): Promise<void> {
  if (!proofPath || !proofPath.startsWith(PROOF_URL_PREFIX)) return;

  const fileName = proofPath.slice(PROOF_URL_PREFIX.length);
  if (!isSafeProofFileName(fileName)) return;

  try {
    await fs.unlink(path.join(PROOF_DIR, fileName));
  } catch {
    // Sudah tidak ada atau tidak bisa dihapus; tidak ada yang bisa dipulihkan di sini.
  }
}

/** Baca satu bukti. `null` bila nama tidak sah atau berkas tidak ada. */
export async function readProof(fileName: string): Promise<Buffer | null> {
  if (!isSafeProofFileName(fileName)) return null;

  const fullPath = path.join(PROOF_DIR, fileName);
  // Lapisan kedua di atas regex: hasil gabungan harus tetap di dalam folder bukti.
  if (!fullPath.startsWith(PROOF_DIR + path.sep)) return null;

  try {
    return await fs.readFile(fullPath);
  } catch {
    return null;
  }
}
