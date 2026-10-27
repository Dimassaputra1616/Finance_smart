import { describe, expect, it } from "vitest";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  checkPasswordChange,
} from "./password-rules";

const base = {
  username: "bendahara",
  current: "kata-sandi-lama-1",
  next: "kopi-hitam-sore-kantor-42",
  confirm: "kopi-hitam-sore-kantor-42",
};

describe("checkPasswordChange — kasus sah", () => {
  it("menerima isian yang benar", () => {
    expect(checkPasswordChange(base)).toBeNull();
  });

  it("menerima tepat di panjang minimum", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
    const next = "kopi-sore9"; // 10 karakter
    expect(next).toHaveLength(MIN_PASSWORD_LENGTH);
    expect(checkPasswordChange({ ...base, next, confirm: next })).toBeNull();
  });

  it("menerima tepat di panjang maksimum", () => {
    const next = "k".repeat(MAX_PASSWORD_LENGTH);
    expect(checkPasswordChange({ ...base, next, confirm: next })).toBeNull();
  });
});

describe("checkPasswordChange — kata sandi saat ini", () => {
  it("wajib diisi", () => {
    const res = checkPasswordChange({ ...base, current: "" });
    expect(res?.currentPassword?.[0]).toContain("wajib");
  });
});

describe("checkPasswordChange — kata sandi baru", () => {
  it("menolak yang kosong", () => {
    const res = checkPasswordChange({ ...base, next: "", confirm: "" });
    expect(res?.newPassword?.[0]).toContain("wajib diisi");
  });

  it("menolak yang hanya berisi spasi walau panjangnya cukup", () => {
    const next = " ".repeat(12);
    const res = checkPasswordChange({ ...base, next, confirm: next });
    expect(res?.newPassword?.[0]).toContain("spasi");
  });

  it("menolak satu karakter di bawah minimum", () => {
    const next = "kopi-sore"; // 9 karakter
    expect(next).toHaveLength(MIN_PASSWORD_LENGTH - 1);
    const res = checkPasswordChange({ ...base, next, confirm: next });
    expect(res?.newPassword?.[0]).toContain("minimal 10");
  });

  it("menolak satu karakter di atas maksimum", () => {
    const next = "k".repeat(MAX_PASSWORD_LENGTH + 1);
    const res = checkPasswordChange({ ...base, next, confirm: next });
    expect(res?.newPassword?.[0]).toContain("maksimal 128");
  });

  it("menolak kata sandi umum, tanpa membedakan huruf besar kecil", () => {
    for (const next of ["1234567890", "Password123", "QWERTYUIOP"]) {
      const res = checkPasswordChange({ ...base, next, confirm: next });
      expect(res?.newPassword?.[0], next).toContain("terlalu umum");
    }
  });

  it("menolak yang memuat kata sandi bawaan sistem", () => {
    for (const next of ["admin123456789", "XXstaf123XXXX"]) {
      const res = checkPasswordChange({ ...base, next, confirm: next });
      expect(res?.newPassword?.[0], next).toContain("bawaan");
    }
  });

  it("menolak yang memuat nama pengguna", () => {
    const next = "Bendahara-2026-aman";
    const res = checkPasswordChange({ ...base, next, confirm: next });
    expect(res?.newPassword?.[0]).toContain("nama pengguna");
  });

  it("tidak menolak berdasarkan nama pengguna yang terlalu pendek", () => {
    const res = checkPasswordChange({
      ...base,
      username: "ab",
      next: "xxabxx-kopi-sore",
      confirm: "xxabxx-kopi-sore",
    });
    expect(res).toBeNull();
  });

  it("menolak yang sama dengan kata sandi sekarang", () => {
    const same = "kata-sandi-lama-panjang";
    const res = checkPasswordChange({ ...base, current: same, next: same, confirm: same });
    expect(res?.newPassword?.[0]).toContain("berbeda");
  });
});

describe("checkPasswordChange — konfirmasi", () => {
  it("menolak konfirmasi yang tidak sama", () => {
    const res = checkPasswordChange({ ...base, confirm: "beda-sama-sekali" });
    expect(res?.confirmPassword?.[0]).toContain("tidak sama");
    expect(res?.newPassword).toBeUndefined();
  });

  it("tidak menumpuk dua pesan wajib-diisi saat kata sandi baru kosong", () => {
    const res = checkPasswordChange({ ...base, next: "", confirm: "apa-saja" });
    expect(res?.newPassword).toBeDefined();
    expect(res?.confirmPassword?.[0]).toContain("tidak sama");
  });

  it("melaporkan beberapa galat sekaligus pada kolom yang berbeda", () => {
    const res = checkPasswordChange({
      username: "bendahara",
      current: "",
      next: "pendek",
      confirm: "lain",
    });
    expect(Object.keys(res ?? {}).sort()).toEqual([
      "confirmPassword",
      "currentPassword",
      "newPassword",
    ]);
  });
});
