import { createHmac } from "crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createSessionToken,
  getAuthSecret,
  verifySession,
  verifySessionToken,
} from "./auth";

const SECRET = "rahasia-uji-coba";

describe("token sesi", () => {
  it("token yang dibuat bisa diverifikasi dan mengembalikan username", async () => {
    const token = await createSessionToken("bangdim", SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe("bangdim");
  });

  it("token dengan objek SessionUser menyimpan dan mengembalikan peran RBAC", async () => {
    const { verifySession } = await import("./auth");
    const token = await createSessionToken(
      {
        id: "usr-1",
        username: "stafkantor",
        role: "STAFF",
        name: "Staf Keuangan",
      },
      SECRET,
    );
    const session = await verifySession(token, SECRET);
    expect(session).not.toBeNull();
    expect(session?.username).toBe("stafkantor");
    expect(session?.role).toBe("STAFF");
    expect(session?.name).toBe("Staf Keuangan");
  });

  it("token dengan secret berbeda ditolak", async () => {
    const token = await createSessionToken("bangdim", SECRET);
    expect(await verifySessionToken(token, "secret-lain")).toBeNull();
  });

  it("token yang dimodifikasi (payload) ditolak", async () => {
    const token = await createSessionToken("bangdim", SECRET);
    const [payload, sig] = token.split(".");
    const fakePayload = Buffer.from(
      JSON.stringify({ u: "penyusup", exp: Date.now() / 1000 + 99999 })
    ).toString("base64url");
    expect(await verifySessionToken(`${fakePayload}.${sig}`, SECRET)).toBeNull();
    // payload asli tapi signature asal juga ditolak
    expect(await verifySessionToken(`${payload}.asalsaja`, SECRET)).toBeNull();
  });

  it("token tanpa format yang benar ditolak", async () => {
    expect(await verifySessionToken("bukan-token", SECRET)).toBeNull();
    expect(await verifySessionToken("", SECRET)).toBeNull();
    expect(await verifySessionToken(".", SECRET)).toBeNull();
  });

  it("token kedaluwarsa ditolak", async () => {
    // Buat token lalu verifikasi dengan waktu yang dimajukan tidak
    // dimungkinkan tanpa mock, jadi uji payload exp manual.
    const { createHmac } = await import("crypto");
    const payload = Buffer.from(
      JSON.stringify({ u: "bangdim", exp: Math.floor(Date.now() / 1000) - 10 })
    ).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
    expect(await verifySessionToken(`${payload}.${sig}`, SECRET)).toBeNull();
  });
});

// Variabel environment yang disentuh tes di bawah dikembalikan seperti semula
// supaya tes lain (dan sesi dev yang sama) tidak ikut berubah.
const ENV_KEYS = ["SESSION_SECRET", "BASIC_AUTH_PASS"] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

/** Token ADMIN palsu yang ditandatangani dengan kunci apa pun. */
function forgeAdminToken(signingKey: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: "penyusup",
      u: "penyusup",
      r: "ADMIN",
      n: "Penyusup",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", signingKey).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

describe("getAuthSecret", () => {
  it("melempar galat bila SESSION_SECRET tidak diisi", () => {
    delete process.env.SESSION_SECRET;
    expect(() => getAuthSecret()).toThrow("SESSION_SECRET");
  });

  it("menolak SESSION_SECRET yang terlalu pendek", () => {
    process.env.SESSION_SECRET = "a".repeat(31);
    expect(() => getAuthSecret()).toThrow("SESSION_SECRET");
  });

  it("mengembalikan nilainya bila panjangnya cukup", () => {
    process.env.SESSION_SECRET = "b".repeat(32);
    expect(getAuthSecret()).toBe("b".repeat(32));
  });
});

describe("kunci tanda tangan lama tidak lagi diterima", () => {
  it("token yang dibuat penguji dengan secret yang benar tetap valid (kontrol)", async () => {
    // Tanpa kontrol ini, dua tes penolakan di bawah bisa lolos hanya karena
    // `forgeAdminToken` menghasilkan token cacat, bukan karena kuncinya ditolak.
    const session = await verifySession(forgeAdminToken(SECRET), SECRET);
    expect(session?.role).toBe("ADMIN");
  });

  it("menolak token yang ditandatangani dengan secret bawaan lama", async () => {
    // Nilai ini pernah menjadi secret bawaan di kode. Wajib tetap ditolak.
    const token = forgeAdminToken("keuangan-enterprise-auth-secret-stable-2026");
    expect(await verifySession(token, SECRET)).toBeNull();
  });

  it("menolak token yang ditandatangani dengan BASIC_AUTH_PASS", async () => {
    process.env.BASIC_AUTH_PASS = "kata-sandi-admin-uji";
    const token = forgeAdminToken("kata-sandi-admin-uji");
    expect(await verifySession(token, SECRET)).toBeNull();
  });
});
