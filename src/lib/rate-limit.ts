/**
 * Aturan murni dan penyimpanan in-memory untuk pembatasan laju percobaan (rate limiting).
 *
 * Mencegah serangan brute-force (penebakan kata sandi berulang) pada form login.
 * Murni, tanpa dependensi database atau waktu sistem (AGENTS.md §5),
 * waktu `now` dapat diinjeksikan agar mudah diuji secara deterministik di vitest.
 */

export type RateLimitConfig = {
  /** Jumlah maksimal kegagalan yang ditoleransi sebelum akun/IP diblokir sementara. */
  maxAttempts: number;
  /** Jendela waktu pemantauan dalam milidetik (misal 15 menit). */
  windowMs: number;
  /** Durasi pemblokiran sementara saat batas terlampaui (dalam milidetik). */
  blockDurationMs?: number;
};

export type RateLimitState = {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

export type RateLimitCheckResult =
  | { allowed: true; remainingAttempts: number }
  | { allowed: false; retryAfterSeconds: number; message: string };

export const DEFAULT_LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 menit
  blockDurationMs: 15 * 60 * 1000, // 15 menit
};

/**
 * Memeriksa apakah percobaan aksi masih diizinkan.
 */
export function evaluateRateLimit(
  state: RateLimitState | undefined,
  config: RateLimitConfig,
  now: number,
): RateLimitCheckResult {
  if (!state) {
    return { allowed: true, remainingAttempts: config.maxAttempts };
  }

  // Cek apakah masih dalam masa blokir aktif
  if (state.blockedUntil && state.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((state.blockedUntil - now) / 1000);
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam ${minutes} menit.`,
    };
  }

  // Jika jendela waktu sudah kedaluwarsa, status dianggap segar kembali
  if (now - state.firstAttemptAt > config.windowMs) {
    return { allowed: true, remainingAttempts: config.maxAttempts };
  }

  const remaining = config.maxAttempts - state.attempts;
  if (remaining <= 0) {
    const blockDuration = config.blockDurationMs ?? config.windowMs;
    const retryAfterSeconds = Math.ceil(blockDuration / 1000);
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi dalam ${minutes} menit.`,
    };
  }

  return { allowed: true, remainingAttempts: remaining };
}

/**
 * Mencatat satu kali kegagalan dan memperbarui state rate limit.
 */
export function registerFailedAttempt(
  state: RateLimitState | undefined,
  config: RateLimitConfig,
  now: number,
): RateLimitState {
  const blockDuration = config.blockDurationMs ?? config.windowMs;

  // Jika belum ada atau jendela waktu lama sudah lewat, mulai jendela baru
  if (!state || now - state.firstAttemptAt > config.windowMs) {
    return {
      attempts: 1,
      firstAttemptAt: now,
    };
  }

  const newAttempts = state.attempts + 1;
  const isNowBlocked = newAttempts >= config.maxAttempts;

  return {
    attempts: newAttempts,
    firstAttemptAt: state.firstAttemptAt,
    blockedUntil: isNowBlocked ? now + blockDuration : undefined,
  };
}

/**
 * Manajer penyimpanan state rate limiting berbasis memori dengan pembersihan otomatis.
 */
export class MemoryRateLimiter {
  private store = new Map<string, RateLimitState>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT) {
    this.config = config;
  }

  /**
   * Cek apakah key (misal username atau IP) boleh melakukan request.
   */
  check(key: string, now: number = Date.now()): RateLimitCheckResult {
    this.prune(now);
    const state = this.store.get(key);
    return evaluateRateLimit(state, this.config, now);
  }

  /**
   * Catat satu kali kegagalan.
   */
  recordFailure(key: string, now: number = Date.now()): RateLimitState {
    const current = this.store.get(key);
    const next = registerFailedAttempt(current, this.config, now);
    this.store.set(key, next);
    return next;
  }

  /**
   * Reset kegagalan setelah pengguna berhasil masuk dengan kredensial yang sah.
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Bersihkan entri yang sudah kedaluwarsa agar memori tidak bocor.
   */
  prune(now: number = Date.now()): void {
    for (const [key, state] of this.store.entries()) {
      const isBlockExpired = !state.blockedUntil || state.blockedUntil <= now;
      const isWindowExpired = now - state.firstAttemptAt > this.config.windowMs;
      if (isBlockExpired && isWindowExpired) {
        this.store.delete(key);
      }
    }
  }

  /** Ukuran map aktif (dipakai unit test). */
  get size(): number {
    return this.store.size;
  }
}

/** Singleton rate limiter login di lingkungan runtime. */
export const loginRateLimiter = new MemoryRateLimiter();
