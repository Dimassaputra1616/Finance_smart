import { NextResponse } from "next/server";
import { proofContentType } from "@/lib/proof-rules";
import { getCurrentUser } from "@/lib/session";
import { readProof } from "@/server/proof-storage";

/**
 * Menyajikan berkas bukti nota. Hanya untuk pengguna yang sudah login.
 *
 * Middleware sudah menolak anonim; pemeriksaan di sini adalah lapisan kedua
 * supaya rute ini tetap aman kalau matcher middleware berubah.
 *
 * Header keamanan: `nosniff` melarang browser menebak jenis isi,
 * `Content-Security-Policy: sandbox` mematikan skrip bila berkas dibuka
 * langsung sebagai halaman.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Tidak diizinkan.", { status: 401 });
  }

  const { file } = await params;
  const contentType = proofContentType(file);
  const data = contentType ? await readProof(file) : null;

  if (!contentType || !data) {
    return new NextResponse("Tidak ditemukan.", { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
