import { z } from "zod";
import { parseRupiahInput } from "./money";

/**
 * Pilihan bentuk kontainer logo pada UI (Sidebar, Header, dsb).
 */
export const LOGO_SHAPES = ["rounded", "circle", "square"] as const;
export type LogoShape = (typeof LOGO_SHAPES)[number];

export const LOGO_SHAPE_LABELS: Record<LogoShape, string> = {
  rounded: "Kotak Tumpul (Rounded)",
  circle: "Lingkaran Penuh (Circle)",
  square: "Proporsional Bebas (Square)",
};

/**
 * Konfigurasi master sistem, identitas merek, profil usaha, aturan otorisasi,
 * dan preferensi operasional perbendaharaan kantor.
 */
export interface BrandConfig {
  // 1. Identitas Brand, Logo, & Maskot Karakter
  appName: string;
  appTagline: string;
  shortName: string;
  hasCustomLogo: boolean;
  logoVersion?: number;
  logoShape?: LogoShape;
  hasCustomMascot?: boolean;
  mascotVersion?: number;
  showMascot?: boolean;

  // 2. Profil Entitas / Badan Usaha (Kop Laporan, Nota, dsb)
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;

  // 3. Aturan Approval & Otorisasi Transaksi
  directorApprovalThreshold?: number; // Nominal pengeluaran staf yang mewajibkan persetujuan Direktur (default Rp 2.500.000)
  autoApproveAdmin?: boolean; // Transaksi dicatat Admin langsung APPROVED otomatis (default true)
  requireProofForExpense?: boolean; // Apakah nota wajib untuk pengeluaran staf (default false)
  budgetAlertThreshold?: number; // Persentase ambang peringatan pagu anggaran (default 80%)

  // 4. Rekening Bawaan, Pajak & Biaya Operasional
  defaultAccountId?: string; // ID Rekening kas bawaan saat membuka form mutasi baru
  defaultTransferFee?: number; // Biaya admin transfer antar rekening default (default 2500)
  defaultTaxRate?: number; // Tarif PPN default dalam persen (default 11)

  // 5. Integrasi Notifikasi Bot Telegram
  telegramBotToken?: string;
  telegramChatId?: string;
  notifyOnIncome?: boolean; // Kirim notif saat ada mutasi kas masuk
  notifyOnExpensePending?: boolean; // Kirim notif saat staf mengajukan pengeluaran
  notifyOnBudgetAlert?: boolean; // Kirim notif saat pos anggaran mendekati limit (> 80%)

  // 6. Integrasi AI Vision & Router (9router / Custom Gateway / Anthropic Protocol)
  aiBaseUrl?: string; // Default: https://api.anthropic.com
  aiModelName?: string; // Default: claude-3-5-haiku-20241022
  anthropicApiKey?: string;

  // 7. Audit Jejak Pembaruan
  updatedAt?: string;
  updatedBy?: string;
}

export type SystemConfig = BrandConfig;

/**
 * Nilai baku identitas dan konfigurasi sistem saat pertama kali dijalankan.
 */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  appName: "Perbendaharaan & Kas",
  appTagline: "Sistem pengendalian keuangan internal",
  shortName: "Keuangan",
  hasCustomLogo: false,
  logoVersion: 1,
  logoShape: "rounded",
  hasCustomMascot: false,
  mascotVersion: 1,
  showMascot: true,

  companyName: "Perbendaharaan & Kas Kantor",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",

  directorApprovalThreshold: 2_500_000,
  autoApproveAdmin: true,
  requireProofForExpense: false,
  budgetAlertThreshold: 80,

  defaultAccountId: "",
  defaultTransferFee: 2500,
  defaultTaxRate: 11,

  telegramBotToken: "",
  telegramChatId: "",
  notifyOnIncome: true,
  notifyOnExpensePending: true,
  notifyOnBudgetAlert: true,

  aiBaseUrl: "https://api.anthropic.com",
  aiModelName: "claude-3-5-haiku-20241022",
  anthropicApiKey: "",
};

/**
 * Skema validasi Zod untuk masukan formulir identitas brand.
 */
export const brandIdentitySchema = z.object({
  appName: z
    .string({ required_error: "Nama aplikasi/brand wajib diisi." })
    .trim()
    .min(2, "Nama aplikasi/brand minimal 2 karakter.")
    .max(50, "Nama aplikasi/brand maksimal 50 karakter."),
  appTagline: z
    .string()
    .trim()
    .max(100, "Tagline maksimal 100 karakter.")
    .default(DEFAULT_BRAND_CONFIG.appTagline),
  shortName: z
    .string({ required_error: "Nama ringkas PWA wajib diisi." })
    .trim()
    .min(2, "Nama ringkas minimal 2 karakter.")
    .max(16, "Nama ringkas maksimal 16 karakter.")
    .default(DEFAULT_BRAND_CONFIG.shortName),
  logoShape: z
    .enum(LOGO_SHAPES, {
      errorMap: () => ({ message: "Bentuk logo harus rounded, circle, atau square." }),
    })
    .default("rounded"),
});

export type BrandIdentityInput = z.infer<typeof brandIdentitySchema>;

/**
 * Skema validasi Zod untuk masukan profil badan usaha / perusahaan.
 */
export const companyProfileSchema = z.object({
  companyName: z
    .string({ required_error: "Nama badan usaha/organisasi wajib diisi." })
    .trim()
    .min(2, "Nama organisasi minimal 2 karakter.")
    .max(100, "Nama organisasi maksimal 100 karakter."),
  companyAddress: z
    .string()
    .trim()
    .max(250, "Alamat maksimal 250 karakter.")
    .optional()
    .default(""),
  companyPhone: z
    .string()
    .trim()
    .max(30, "Nomor telepon maksimal 30 karakter.")
    .optional()
    .default(""),
  companyEmail: z
    .string()
    .trim()
    .max(100, "Alamat email maksimal 100 karakter.")
    .optional()
    .default(""),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

/**
 * Skema validasi Zod untuk aturan otorisasi & approval transaksi.
 */
export const approvalRulesSchema = z.object({
  directorApprovalThreshold: z
    .string()
    .transform((val) => val.trim())
    .transform((val, ctx) => {
      if (!val) return DEFAULT_BRAND_CONFIG.directorApprovalThreshold;
      const parsed = parseRupiahInput(val);
      if (parsed === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Batas nominal approval Direktur tidak valid.",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  autoApproveAdmin: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(true),
  requireProofForExpense: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(false),
  budgetAlertThreshold: z
    .coerce
    .number({ invalid_type_error: "Ambang batas anggaran harus berupa angka." })
    .min(50, "Ambang batas anggaran minimal 50%.")
    .max(100, "Ambang batas anggaran maksimal 100%.")
    .default(80),
});

export type ApprovalRulesInput = z.infer<typeof approvalRulesSchema>;

/**
 * Skema validasi Zod untuk preferensi rekening default, biaya transfer, & pajak.
 */
export const financeDefaultsSchema = z.object({
  defaultAccountId: z
    .string()
    .trim()
    .optional()
    .default(""),
  defaultTransferFee: z
    .string()
    .transform((val) => val.trim())
    .transform((val, ctx) => {
      if (!val) return 0;
      const parsed = parseRupiahInput(val);
      if (parsed === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Biaya transfer harus berupa angka positif.",
        });
        return z.NEVER;
      }
      return parsed;
    }),
  defaultTaxRate: z
    .coerce
    .number({ invalid_type_error: "Tarif pajak harus berupa angka." })
    .min(0, "Tarif pajak tidak boleh negatif.")
    .max(100, "Tarif pajak maksimal 100%.")
    .default(11),
});

export type FinanceDefaultsInput = z.infer<typeof financeDefaultsSchema>;

/**
 * Skema validasi Zod untuk integrasi bot notifikasi Telegram.
 */
export const telegramNotificationSchema = z.object({
  telegramBotToken: z
    .string()
    .trim()
    .max(150, "Bot Token maksimal 150 karakter.")
    .optional()
    .default(""),
  telegramChatId: z
    .string()
    .trim()
    .max(100, "Chat ID grup maksimal 100 karakter.")
    .optional()
    .default(""),
  notifyOnIncome: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(true),
  notifyOnExpensePending: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(true),
  notifyOnBudgetAlert: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(true),
});

export type TelegramNotificationInput = z.infer<typeof telegramNotificationSchema>;

export const aiIntegrationSchema = z.object({
  aiBaseUrl: z
    .string()
    .trim()
    .max(250, "Alamat Base URL maksimal 250 karakter.")
    .optional()
    .default(DEFAULT_BRAND_CONFIG.aiBaseUrl ?? "https://api.anthropic.com"),
  aiModelName: z
    .string()
    .trim()
    .max(100, "Nama model maksimal 100 karakter.")
    .optional()
    .default(DEFAULT_BRAND_CONFIG.aiModelName ?? "claude-3-5-haiku-20241022"),
  anthropicApiKey: z
    .string()
    .trim()
    .max(250, "Kunci API maksimal 250 karakter.")
    .optional()
    .default(""),
});

export type AiIntegrationInput = z.infer<typeof aiIntegrationSchema>;

/** Backward compatible alias */
export const systemPreferencesSchema = z.object({
  budgetAlertThreshold: z
    .coerce
    .number()
    .min(50)
    .max(100)
    .default(80),
  requireProofForExpense: z
    .preprocess((val) => val === true || val === "true" || val === "1" || val === "on", z.boolean())
    .default(false),
});

export type SystemPreferencesInput = z.infer<typeof systemPreferencesSchema>;

/**
 * Helper pembentuk URL logo dengan cache busting versi.
 */
export function getBrandLogoUrl(config?: BrandConfig | null): string | null {
  if (!config?.hasCustomLogo) return null;
  const version = config.logoVersion ?? 1;
  return `/api/brand/logo?v=${version}`;
}

/**
 * Helper pembentuk URL maskot dengan cache busting versi.
 */
export function getBrandMascotUrl(config?: BrandConfig | null): string {
  const version = config?.mascotVersion ?? 1;
  return `/api/mascot?v=${version}`;
}
