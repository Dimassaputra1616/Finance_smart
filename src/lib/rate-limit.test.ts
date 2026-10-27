import { describe, expect, it } from "vitest";
import {
  MemoryRateLimiter,
  evaluateRateLimit,
  registerFailedAttempt,
} from "./rate-limit";

const CONFIG = {
  maxAttempts: 3,
  windowMs: 60_000, // 1 menit
  blockDurationMs: 60_000, // 1 menit blokir
};

describe("evaluateRateLimit — fungsi murni", () => {
  const t0 = 1_000_000;

  it("mengizinkan percobaan pertama saat state belum ada", () => {
    const res = evaluateRateLimit(undefined, CONFIG, t0);
    expect(res.allowed).toBe(true);
    if (res.allowed) expect(res.remainingAttempts).toBe(3);
  });

  it("mengizinkan jika percobaan gagal masih di bawah batas", () => {
    const state = { attempts: 2, firstAttemptAt: t0 };
    const res = evaluateRateLimit(state, CONFIG, t0 + 10_000);
    expect(res.allowed).toBe(true);
    if (res.allowed) expect(res.remainingAttempts).toBe(1);
  });

  it("menolak bila masih dalam masa blokir aktif", () => {
    const state = {
      attempts: 3,
      firstAttemptAt: t0,
      blockedUntil: t0 + 30_000,
    };
    const res = evaluateRateLimit(state, CONFIG, t0 + 10_000);
    expect(res.allowed).toBe(false);
    if (!res.allowed) {
      expect(res.retryAfterSeconds).toBe(20);
      expect(res.message).toContain("Terlalu banyak percobaan");
    }
  });

  it("mengizinkan kembali setelah masa blokir lewat", () => {
    const state = {
      attempts: 3,
      firstAttemptAt: t0,
      blockedUntil: t0 + 30_000,
    };
    // Waktu sudah lewat dari t0 + 60_000 (jendela waktu habis)
    const res = evaluateRateLimit(state, CONFIG, t0 + 65_000);
    expect(res.allowed).toBe(true);
  });

  it("mengizinkan bila jendela waktu habis walau belum terblokir", () => {
    const state = { attempts: 2, firstAttemptAt: t0 };
    // t0 + 61_000 sudah lewat dari windowMs (60_000)
    const res = evaluateRateLimit(state, CONFIG, t0 + 61_000);
    expect(res.allowed).toBe(true);
    if (res.allowed) expect(res.remainingAttempts).toBe(3);
  });
});

describe("registerFailedAttempt — pencatatan kegagalan", () => {
  const t0 = 2_000_000;

  it("memulai state baru pada kegagalan pertama", () => {
    const s1 = registerFailedAttempt(undefined, CONFIG, t0);
    expect(s1.attempts).toBe(1);
    expect(s1.firstAttemptAt).toBe(t0);
    expect(s1.blockedUntil).toBeUndefined();
  });

  it("menambah jumlah kegagalan pada kegagalan kedua", () => {
    const s1 = { attempts: 1, firstAttemptAt: t0 };
    const s2 = registerFailedAttempt(s1, CONFIG, t0 + 5_000);
    expect(s2.attempts).toBe(2);
    expect(s2.firstAttemptAt).toBe(t0);
    expect(s2.blockedUntil).toBeUndefined();
  });

  it("memasang blokir saat kegagalan mencapai batas maxAttempts", () => {
    const s2 = { attempts: 2, firstAttemptAt: t0 };
    const s3 = registerFailedAttempt(s2, CONFIG, t0 + 10_000);
    expect(s3.attempts).toBe(3);
    expect(s3.blockedUntil).toBe(t0 + 10_000 + CONFIG.blockDurationMs);
  });

  it("mereset hitungan ke 1 jika kegagalan terjadi setelah jendela waktu lama lewat", () => {
    const oldState = { attempts: 2, firstAttemptAt: t0 };
    const next = registerFailedAttempt(oldState, CONFIG, t0 + 100_000);
    expect(next.attempts).toBe(1);
    expect(next.firstAttemptAt).toBe(t0 + 100_000);
    expect(next.blockedUntil).toBeUndefined();
  });
});

describe("MemoryRateLimiter — manajer memori", () => {
  it("bekerja penuh: cek, rekam gagal, blokir, dan reset", () => {
    const limiter = new MemoryRateLimiter({
      maxAttempts: 2,
      windowMs: 10_000,
      blockDurationMs: 10_000,
    });
    const key = "user-test-ip";
    const now = 100_000;

    // Awal: boleh
    expect(limiter.check(key, now).allowed).toBe(true);

    // Gagal 1: masih boleh
    limiter.recordFailure(key, now);
    expect(limiter.check(key, now).allowed).toBe(true);

    // Gagal 2: batas tercapai -> diblokir
    limiter.recordFailure(key, now);
    const blocked = limiter.check(key, now);
    expect(blocked.allowed).toBe(false);

    // Reset setelah login sukses -> langsung boleh kembali
    limiter.reset(key);
    expect(limiter.check(key, now).allowed).toBe(true);
  });

  it("prune membersihkan entri yang sudah kedaluwarsa", () => {
    const limiter = new MemoryRateLimiter({
      maxAttempts: 2,
      windowMs: 5_000,
      blockDurationMs: 5_000,
    });
    limiter.recordFailure("k1", 10_000);
    limiter.recordFailure("k2", 10_000);
    expect(limiter.size).toBe(2);

    // Setelah waktu windowMs lewat, prune menghapus entri
    limiter.prune(20_000);
    expect(limiter.size).toBe(0);
  });
});
