import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { readBrandMascotFile } from "@/server/brand-storage";

export const dynamic = "force-dynamic";

let cachedDefaultMascotBuffer: Buffer | null = null;

export async function GET() {
  // 1. Cek apakah ada maskot kustom yang diunggah pengguna lewat Config Master
  try {
    const custom = await readBrandMascotFile();
    if (custom) {
      return new NextResponse(new Uint8Array(custom.buffer), {
        headers: {
          "Content-Type": custom.contentType,
          "Content-Length": String(custom.buffer.length),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch {}

  // 2. Fallback ke maskot 3D bendahara bawaan ("The 3D Corporate Treasurer")
  const publicPath = path.join(process.cwd(), "public", "treasurer-3d.png");

  try {
    if (!cachedDefaultMascotBuffer) {
      cachedDefaultMascotBuffer = await fs.readFile(publicPath);
    }

    return new NextResponse(new Uint8Array(cachedDefaultMascotBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(cachedDefaultMascotBuffer.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Maskot tidak ditemukan", { status: 404 });
  }
}
