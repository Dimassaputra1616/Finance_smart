/**
 * Token sesi bertanda tangan (HMAC-SHA256).
 *
 * Dipakai untuk mengingat status login dan peran RBAC (ADMIN | STAFF) tanpa
 * server-side session storage — cocok untuk deployment serverless di mana memori
 * antar request tidak dijamin sama. Token tidak bisa dipalsukan tanpa mengetahui secret.
 *
 * Format: `base64url(payload).base64url(signature)`.
 * Payload: `{ id, u: username, r: role, n: name, exp: unix_timestamp }`.
 *
 * Memakai Web Crypto API supaya bisa jalan di middleware (Edge) maupun di
 * Server Action (Node).
 */

export const SESSION_COOKIE_NAME = "keuangan_session";

/** 30 hari, dalam detik. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  username: string;
  role: "ADMIN" | "STAFF";
  name: string;
};

type SessionPayload = {
  id?: string;
  u: string;
  r?: "ADMIN" | "STAFF";
  n?: string;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecodeToString(s: string): string {
  return Buffer.from(s, "base64url").toString("utf-8");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return base64UrlEncode(new Uint8Array(sig));
}

/**
 * Perbandingan string dalam waktu konstan untuk mencegah timing attack.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Panjang minimum kunci penandatangan sesi (karakter). */
const MIN_SECRET_LENGTH = 32;

/**
 * Kunci penandatanganan sesi, dibaca dari `SESSION_SECRET` di environment.
 *
 * Sengaja TIDAK punya nilai bawaan. Kunci yang tertulis di kode bisa dibaca
 * siapa pun yang punya akses ke repo, dan dengan kunci itu token ADMIN palsu
 * bisa dibuat tanpa login. Lebih baik aplikasi menolak jalan daripada diam-diam
 * memakai kunci yang diketahui publik.
 *
 * Dipanggil dari Edge Middleware maupun Server Action, jadi hanya membaca
 * `process.env` dan tidak memakai API khusus Node.
 */
export function getAuthSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET wajib diisi minimal ${MIN_SECRET_LENGTH} karakter. ` +
        "Buat dengan `openssl rand -hex 32` lalu taruh di .env.",
    );
  }

  return secret;
}

/** Buat token sesi baru untuk username atau objek SessionUser. */
export async function createSessionToken(
  userOrUsername:
    | string
    | {
        id?: string;
        username: string;
        role?: "ADMIN" | "STAFF";
        name?: string;
      },
  secret: string,
): Promise<string> {
  const isString = typeof userOrUsername === "string";
  const u = isString ? userOrUsername : userOrUsername.username;
  const r = isString ? "ADMIN" : userOrUsername.role ?? "ADMIN";
  const id = isString
    ? userOrUsername
    : userOrUsername.id ?? userOrUsername.username;
  const n = isString
    ? userOrUsername
    : userOrUsername.name ?? userOrUsername.username;

  const payload: SessionPayload = {
    id,
    u,
    r,
    n,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sig = await hmacSign(encoded, secret);
  return `${encoded}.${sig}`;
}

/**
 * Verifikasi token sesi secara penuh dan mengembalikan objek `SessionUser`.
 * Mengembalikan `null` bila token tidak valid atau kedaluwarsa.
 */
export async function verifySession(
  token: string,
  secret: string,
): Promise<SessionUser | null> {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Hanya satu kunci yang diterima: yang diberikan pemanggil. Tidak ada kunci
  // cadangan. Dulu token juga diterima bila ditandatangani dengan secret
  // statis di kode atau dengan `BASIC_AUTH_PASS`, sehingga siapa pun yang
  // tahu salah satunya bisa memalsukan sesi ADMIN.
  const expected = await hmacSign(encoded, secret);

  if (!constantTimeEqual(sig, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(encoded)) as SessionPayload;
  } catch {
    return null;
  }
  if (
    typeof payload.u !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const role = payload.r === "STAFF" ? "STAFF" : "ADMIN";
  return {
    id: payload.id ?? payload.u,
    username: payload.u,
    role,
    name: payload.n ?? payload.u,
  };
}

/**
 * Verifikasi token sesi ringkas (kompatibilitas backward).
 * Mengembalikan username bila valid dan belum kedaluwarsa, `null` bila tidak.
 */
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<string | null> {
  const session = await verifySession(token, secret);
  return session ? session.username : null;
}
