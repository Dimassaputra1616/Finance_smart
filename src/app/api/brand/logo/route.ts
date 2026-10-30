import { NextResponse } from "next/server";
import { readBrandLogoFile } from "@/server/brand-storage";

export const dynamic = "force-dynamic";

/**
 * Endpoint publik penyedia berkas logo kustom perusahaan/aplikasi.
 *
 * Mengembalikan gambar logo yang aktif atau HTTP 404 jika belum diatur.
 * Diizinkan diakses tanpa sesi oleh middleware agar halaman login dapat
 * menampilkan logo brand.
 */
export async function GET() {
  const result = await readBrandLogoFile();

  if (!result) {
    return new NextResponse("Logo belum diunggah", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.buffer.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
