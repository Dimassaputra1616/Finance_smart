import type { NextConfig } from "next";

/**
 * Pemisahan folder output antara `next dev` dan `next build`.
 *
 * Secara bawaan keduanya memakai folder `.next`, sehingga menjalankan build
 * produksi sementara dev server hidup akan menimpa chunk milik dev. Gejalanya
 * `Cannot find module './xxx.js'` dan halaman kosong.
 *
 * Dev tetap memakai `.next`. Build produksi diarahkan ke `.next-build` lewat
 * variabel `NEXT_DIST_DIR` yang diset di script npm, jadi keduanya tidak pernah
 * saling menimpa.
 */
const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  distDir,
  experimental: {
    serverActions: {
      // Batas bawaan Server Action 1 MB. Bukti nota boleh sampai 5 MB (lihat
      // MAX_PROOF_BYTES di src/lib/proof-rules.ts) ditambah isian form, jadi
      // tanpa ini berkas di atas 1 MB ditolak Next sebelum kode kita jalan.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
