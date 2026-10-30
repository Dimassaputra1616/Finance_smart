import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { scanReceiptWithClaude } from "@/server/ai-receipt-scanner";

export const dynamic = "force-dynamic";

/**
 * Endpoint POST untuk memindai bukti nota/kuitansi dengan AI Vision.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Sesi telah berakhir. Silakan masuk kembali." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { ok: false, message: "Berkas foto nota tidak ditemukan." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";

    const result = await scanReceiptWithClaude(buffer, mimeType);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Terjadi galat server: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
