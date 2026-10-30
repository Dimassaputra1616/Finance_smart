import { describe, expect, it } from "vitest";
import {
  aiIntegrationSchema,
  approvalRulesSchema,
  brandIdentitySchema,
  companyProfileSchema,
  financeDefaultsSchema,
  systemPreferencesSchema,
  telegramNotificationSchema,
  DEFAULT_BRAND_CONFIG,
  getBrandLogoUrl,
  type BrandConfig,
} from "./brand-config";

describe("brandIdentitySchema", () => {
  it("menerima masukan identitas brand yang valid", () => {
    const parsed = brandIdentitySchema.safeParse({
      appName: "PT Keuangan Maju",
      appTagline: "Sistem Keuangan Modern",
      shortName: "KeuanganMaju",
      logoShape: "circle",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.appName).toBe("PT Keuangan Maju");
      expect(parsed.data.appTagline).toBe("Sistem Keuangan Modern");
      expect(parsed.data.shortName).toBe("KeuanganMaju");
      expect(parsed.data.logoShape).toBe("circle");
    }
  });

  it("menolak nama aplikasi yang terlalu pendek (< 2 karakter)", () => {
    const parsed = brandIdentitySchema.safeParse({
      appName: "A",
      appTagline: "Deskripsi",
      shortName: "A",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.appName).toBeDefined();
    }
  });

  it("menolak nama aplikasi yang terlalu panjang (> 50 karakter)", () => {
    const longName = "A".repeat(51);
    const parsed = brandIdentitySchema.safeParse({
      appName: longName,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.appName).toBeDefined();
    }
  });

  it("memakai nilai default jika tagline atau shortName tidak diisi", () => {
    const parsed = brandIdentitySchema.safeParse({
      appName: "Kas Kantor",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.appTagline).toBe(DEFAULT_BRAND_CONFIG.appTagline);
      expect(parsed.data.shortName).toBe(DEFAULT_BRAND_CONFIG.shortName);
      expect(parsed.data.logoShape).toBe("rounded");
    }
  });

  it("menolak bentuk logo yang bukan rounded | circle | square", () => {
    const parsed = brandIdentitySchema.safeParse({
      appName: "Kas Kantor",
      logoShape: "triangle",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("getBrandLogoUrl", () => {
  it("mengembalikan null jika hasCustomLogo bernilai false", () => {
    const config: BrandConfig = {
      ...DEFAULT_BRAND_CONFIG,
      hasCustomLogo: false,
    };
    expect(getBrandLogoUrl(config)).toBeNull();
  });

  it("mengembalikan URL logo dengan cache buster jika hasCustomLogo bernilai true", () => {
    const config: BrandConfig = {
      ...DEFAULT_BRAND_CONFIG,
      hasCustomLogo: true,
      logoVersion: 1730000000000,
    };
    expect(getBrandLogoUrl(config)).toBe("/api/brand/logo?v=1730000000000");
  });

  it("mengembalikan null jika config tidak diberikan (undefined)", () => {
    expect(getBrandLogoUrl(undefined)).toBeNull();
  });
});

describe("companyProfileSchema", () => {
  it("menerima data profil perusahaan yang valid", () => {
    const parsed = companyProfileSchema.safeParse({
      companyName: "PT Sinar Keuangan Mandiri",
      companyAddress: "Jl. Sudirman Kav 21, Jakarta Selatan",
      companyPhone: "+62 812-3456-7890",
      companyEmail: "finance@sinarkeuangan.co.id",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.companyName).toBe("PT Sinar Keuangan Mandiri");
      expect(parsed.data.companyEmail).toBe("finance@sinarkeuangan.co.id");
    }
  });

  it("menolak nama perusahaan yang terlalu pendek (< 2 karakter)", () => {
    const parsed = companyProfileSchema.safeParse({
      companyName: "A",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("systemPreferencesSchema", () => {
  it("menerima ambang batas anggaran yang valid", () => {
    const parsed = systemPreferencesSchema.safeParse({
      budgetAlertThreshold: 85,
      requireProofForExpense: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.budgetAlertThreshold).toBe(85);
      expect(parsed.data.requireProofForExpense).toBe(true);
    }
  });

  it("menolak ambang batas di luar rentang 50 - 100", () => {
    const low = systemPreferencesSchema.safeParse({ budgetAlertThreshold: 40 });
    const high = systemPreferencesSchema.safeParse({ budgetAlertThreshold: 110 });

    expect(low.success).toBe(false);
    expect(high.success).toBe(false);
  });
});

describe("approvalRulesSchema", () => {
  it("menerima batas approval dan flag otorisasi yang sah", () => {
    const parsed = approvalRulesSchema.safeParse({
      directorApprovalThreshold: "5.000.000",
      autoApproveAdmin: "true",
      requireProofForExpense: "true",
      budgetAlertThreshold: "85",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.directorApprovalThreshold).toBe(5_000_000);
      expect(parsed.data.autoApproveAdmin).toBe(true);
      expect(parsed.data.requireProofForExpense).toBe(true);
      expect(parsed.data.budgetAlertThreshold).toBe(85);
    }
  });

  it("memakai nilai default bila directorApprovalThreshold dikosongkan", () => {
    const parsed = approvalRulesSchema.safeParse({
      directorApprovalThreshold: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.directorApprovalThreshold).toBe(DEFAULT_BRAND_CONFIG.directorApprovalThreshold);
    }
  });
});

describe("financeDefaultsSchema", () => {
  it("menerima rekening default, biaya transfer, dan tarif pajak", () => {
    const parsed = financeDefaultsSchema.safeParse({
      defaultAccountId: "acc_123",
      defaultTransferFee: "2.500",
      defaultTaxRate: "11",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.defaultAccountId).toBe("acc_123");
      expect(parsed.data.defaultTransferFee).toBe(2500);
      expect(parsed.data.defaultTaxRate).toBe(11);
    }
  });
});

describe("telegramNotificationSchema", () => {
  it("menerima token bot telegram dan saklar notifikasi", () => {
    const parsed = telegramNotificationSchema.safeParse({
      telegramBotToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      telegramChatId: "-100123456789",
      notifyOnIncome: "true",
      notifyOnExpensePending: "true",
      notifyOnBudgetAlert: "false",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.telegramBotToken).toBe("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11");
      expect(parsed.data.notifyOnBudgetAlert).toBe(false);
    }
  });
});

describe("aiIntegrationSchema", () => {
  it("menerima konfigurasi 9router / custom gateway AI", () => {
    const parsed = aiIntegrationSchema.safeParse({
      aiBaseUrl: "https://api.9router.com",
      aiModelName: "claude-3-5-haiku-20241022",
      anthropicApiKey: "sk-ant-samplekey1234567890",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.aiBaseUrl).toBe("https://api.9router.com");
      expect(parsed.data.aiModelName).toBe("claude-3-5-haiku-20241022");
      expect(parsed.data.anthropicApiKey).toBe("sk-ant-samplekey1234567890");
    }
  });

  it("memakai nilai default jika base URL atau model tidak diisi", () => {
    const parsed = aiIntegrationSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.aiBaseUrl).toBe("https://api.anthropic.com");
      expect(parsed.data.aiModelName).toBe("claude-3-5-haiku-20241022");
    }
  });
});


