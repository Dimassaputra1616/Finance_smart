import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { savePushSubscription } from "@/server/notifications-storage";

export const dynamic = "force-dynamic";

/**
 * Menyimpan token langganan Web Push dari browser HP pengguna.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await request.json();
    const userAgent = request.headers.get("user-agent") || "";

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ ok: false, message: "Subscription tidak valid" }, { status: 400 });
    }

    await savePushSubscription(subscription, `${user.name} - ${userAgent.slice(0, 80)}`);

    return NextResponse.json({ ok: true, message: "Perangkat berhasil didaftarkan untuk notifikasi." });
  } catch {
    return NextResponse.json({ ok: false, message: "Gagal menyimpan langganan notifikasi." }, { status: 500 });
  }
}
