/**
 * Modul terpadu untuk layanan Neon Cloud Platform.
 *
 * Menggabungkan informasi dan koneksi dari variabel lingkungan yang di-inject oleh Neon CLI:
 * - Database PostgreSQL (Pooled & Unpooled)
 * - Object Storage (S3-compatible bucket assets)
 * - Neon Auth & JWKS
 * - Neon Realtime
 * - Neon Functions
 */

export interface NeonServiceStatus {
  service: string;
  configured: boolean;
  details?: Record<string, unknown>;
}

export function getNeonServices() {
  return {
    branch: process.env.NEON_BRANCH ?? "production",
    postgres: {
      configured: Boolean(process.env.DATABASE_URL),
      pooledUrl: process.env.DATABASE_URL,
      unpooledUrl: process.env.DATABASE_URL_UNPOOLED,
    },
    auth: {
      configured: Boolean(process.env.NEON_AUTH_BASE_URL),
      baseUrl: process.env.NEON_AUTH_BASE_URL,
      jwksUrl: process.env.NEON_AUTH_JWKS_URL,
    },
    storage: {
      configured: Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID),
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION ?? "ap-southeast-1",
      bucket: "assets",
    },
    realtime: {
      configured: Boolean(process.env.NEON_REALTIME_URL),
      url: process.env.NEON_REALTIME_URL,
    },
    functions: {
      configured: Boolean(process.env.NEON_FUNCTION_HELLO_BASE_URL),
      helloUrl: process.env.NEON_FUNCTION_HELLO_BASE_URL,
    },
  };
}
