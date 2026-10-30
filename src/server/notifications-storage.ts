import "server-only";
import fs from "fs/promises";
import path from "path";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  url?: string;
  type?: "transaction" | "approval" | "budget" | "system";
  targetRole?: "DIRECTOR" | "ADMIN" | "STAFF" | "ALL";
  createdAt: string;
  read: boolean;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  createdAt: string;
}

const NOTIF_DIR = path.join(process.cwd(), "storage", "notifications");
const INBOX_FILE = path.join(NOTIF_DIR, "inbox.json");
const SUBS_FILE = path.join(NOTIF_DIR, "subscriptions.json");

/**
 * Membaca seluruh daftar notifikasi aplikasi dari penyimpanan lokal server.
 * Dapat difilter berdasarkan peran pengguna aktif (Direktur, Admin, Staf).
 */
export async function getAppNotifications(userRole?: string): Promise<{
  items: AppNotification[];
  unreadCount: number;
}> {
  try {
    await fs.mkdir(NOTIF_DIR, { recursive: true });
    const raw = await fs.readFile(INBOX_FILE, "utf-8");
    const allItems: AppNotification[] = JSON.parse(raw);

    // Filter notifikasi sesuai peran pengguna
    const items = allItems.filter((n) => {
      if (!n.targetRole || n.targetRole === "ALL") return true;
      if (userRole === "ADMIN") return true; // Super Admin dapat memantau semua
      if (userRole === "DIRECTOR") {
        return n.targetRole === "DIRECTOR" || n.targetRole === "ADMIN";
      }
      if (userRole === "STAFF") {
        return n.targetRole === "STAFF";
      }
      return true;
    });

    const unreadCount = items.filter((n) => !n.read).length;
    return { items, unreadCount };
  } catch {
    return { items: [], unreadCount: 0 };
  }
}

/**
 * Menambahkan notifikasi baru ke kotak masuk aplikasi.
 */
export async function addAppNotification(params: {
  title: string;
  body: string;
  url?: string;
  type?: "transaction" | "approval" | "budget" | "system";
  targetRole?: "DIRECTOR" | "ADMIN" | "STAFF" | "ALL";
}): Promise<AppNotification> {
  await fs.mkdir(NOTIF_DIR, { recursive: true });
  const { items: allItems } = await getAppNotifications("ADMIN");

  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: params.title,
    body: params.body,
    url: params.url || "/",
    type: params.type || "system",
    targetRole: params.targetRole || "ALL",
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Simpan maksimal 50 notifikasi terbaru
  const nextItems = [newNotif, ...allItems].slice(0, 50);
  await fs.writeFile(INBOX_FILE, JSON.stringify(nextItems, null, 2), "utf-8");

  return newNotif;
}

/**
 * Menandai seluruh notifikasi telah dibaca oleh pengguna.
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const { items } = await getAppNotifications();
    const updated = items.map((n) => ({ ...n, read: true }));
    await fs.writeFile(INBOX_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Menyimpan data langganan Web Push (token HP) dari browser perangkat.
 */
export async function savePushSubscription(
  sub: { endpoint: string; expirationTime?: number | null; keys: PushSubscriptionKeys },
  userAgent?: string,
): Promise<boolean> {
  try {
    await fs.mkdir(NOTIF_DIR, { recursive: true });
    let subs: PushSubscriptionRecord[] = [];
    try {
      const raw = await fs.readFile(SUBS_FILE, "utf-8");
      subs = JSON.parse(raw);
    } catch {}

    // Ganti atau tambahkan langganan endpoint
    const filtered = subs.filter((s) => s.endpoint !== sub.endpoint);
    filtered.push({
      endpoint: sub.endpoint,
      expirationTime: sub.expirationTime,
      keys: sub.keys,
      userAgent: userAgent || "",
      createdAt: new Date().toISOString(),
    });

    await fs.writeFile(SUBS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Mendapatkan seluruh perangkat yang berlangganan Web Push.
 */
export async function getPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  try {
    const raw = await fs.readFile(SUBS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Menghapus langganan push yang sudah kedaluwarsa.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  try {
    const subs = await getPushSubscriptions();
    const updated = subs.filter((s) => s.endpoint !== endpoint);
    await fs.writeFile(SUBS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch {}
}
