import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  getAppNotifications,
  markAllNotificationsAsRead,
  addAppNotification,
} from "@/server/notifications-storage";

export const dynamic = "force-dynamic";

/**
 * Mendapatkan daftar notifikasi aplikasi terkini.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppNotifications(user.role);
  return NextResponse.json({ ok: true, ...data });
}

/**
 * Aksi notifikasi: tandai sudah dibaca atau buat notifikasi baru.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === "read_all") {
      await markAllNotificationsAsRead();
      return NextResponse.json({ ok: true, message: "Semua notifikasi ditandai telah dibaca." });
    }

    if (body.action === "create") {
      const notif = await addAppNotification({
        title: body.title || "Pemberitahuan Sistem",
        body: body.body || "",
        url: body.url || "/",
        type: body.type || "system",
      });
      return NextResponse.json({ ok: true, item: notif });
    }

    return NextResponse.json({ ok: false, message: "Aksi tidak dikenal" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Galat memproses permintaan" }, { status: 500 });
  }
}
