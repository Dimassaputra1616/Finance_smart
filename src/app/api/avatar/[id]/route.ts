import { NextResponse } from "next/server";
import { readAvatarFile } from "@/server/avatar-storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await readAvatarFile(id);

  if (!data) {
    return new NextResponse("Avatar tidak ditemukan", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
