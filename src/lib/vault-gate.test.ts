import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import {
  VAULT_ATTRIBUTE,
  VAULT_INIT_SCRIPT,
  VAULT_STORAGE_KEY,
  hasPlayed,
  markPlayed,
} from "./vault-gate";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const blockedStorage = {
  getItem: () => {
    throw new Error("dibatasi");
  },
  setItem: () => {
    throw new Error("dibatasi");
  },
};

/** Jalankan skrip inline dengan `sessionStorage` dan `document` palsu. */
function runInitScript(storage: unknown) {
  const attributes: Record<string, string> = {};
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attributes[name] = value;
      },
    },
  };

  vm.runInNewContext(VAULT_INIT_SCRIPT, { sessionStorage: storage, document });
  return attributes;
}

describe("hasPlayed / markPlayed", () => {
  it("belum pernah diputar pada penyimpanan kosong", () => {
    expect(hasPlayed(fakeStorage())).toBe(false);
  });

  it("tercatat setelah ditandai", () => {
    const storage = fakeStorage();
    markPlayed(storage);
    expect(hasPlayed(storage)).toBe(true);
  });

  it("hanya nilai '1' yang dianggap sudah diputar", () => {
    expect(hasPlayed(fakeStorage({ [VAULT_STORAGE_KEY]: "0" }))).toBe(false);
    expect(hasPlayed(fakeStorage({ [VAULT_STORAGE_KEY]: "" }))).toBe(false);
  });

  it("tanpa penyimpanan dianggap belum diputar dan tidak error", () => {
    expect(hasPlayed(undefined)).toBe(false);
    expect(hasPlayed(null)).toBe(false);
    expect(() => markPlayed(undefined)).not.toThrow();
  });

  it("penyimpanan yang diblokir tidak melempar galat", () => {
    expect(hasPlayed(blockedStorage)).toBe(false);
    expect(() => markPlayed(blockedStorage)).not.toThrow();
  });
});

describe("VAULT_INIT_SCRIPT", () => {
  it("mematikan gerbang bila sudah pernah diputar di sesi ini", () => {
    const attributes = runInitScript(fakeStorage({ [VAULT_STORAGE_KEY]: "1" }));
    expect(attributes).toEqual({ [VAULT_ATTRIBUTE]: "1" });
  });

  it("membiarkan gerbang menyala pada kunjungan pertama", () => {
    expect(runInitScript(fakeStorage())).toEqual({});
  });

  it("hanya membaca: tidak menandai penyimpanan sendiri", () => {
    // Kalau skrip menandai duluan, gerbang yang belum sempat dilihat penuh
    // sudah dianggap selesai dan tidak akan diputar lagi.
    const storage = fakeStorage();
    runInitScript(storage);
    expect(storage.data.size).toBe(0);
  });

  it("tidak melempar galat saat penyimpanan diblokir, dan gerbang tetap menyala", () => {
    expect(() => runInitScript(blockedStorage)).not.toThrow();
    expect(runInitScript(blockedStorage)).toEqual({});
  });

  it("nama atribut dipakai oleh selektor yang mematikan gerbang di globals.css", () => {
    // Mengubah salah satu tanpa yang lain membuat gerbang tidak pernah mati.
    // Berkasnya dibaca sungguhan; membandingkan konstanta dengan string saja
    // tidak akan menangkap selektor CSS yang berubah.
    const css = fs.readFileSync(
      path.join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );

    expect(css).toContain(`html[${VAULT_ATTRIBUTE}] .vault-gate`);
    expect(css).toContain(`html[${VAULT_ATTRIBUTE}] .animate-vault-reveal`);
  });
});
