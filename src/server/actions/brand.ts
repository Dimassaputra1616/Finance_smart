"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { canAccessConfigMaster } from "@/lib/transaction-rules";
import {
  aiIntegrationSchema,
  approvalRulesSchema,
  brandIdentitySchema,
  companyProfileSchema,
  financeDefaultsSchema,
  systemPreferencesSchema,
  telegramNotificationSchema,
} from "@/lib/brand-config";
import {
  saveBrandConfig,
  saveBrandLogoFile,
  deleteBrandLogoFile,
  saveBrandMascotFile,
  deleteBrandMascotFile,
  resetBrandConfig,
} from "@/server/brand-storage";
import { actionError, type ActionResult } from "@/lib/types";

/**
 * Memperbarui nama aplikasi, slogan (tagline), dan bentuk kontainer logo.
 * Wewenang dibatasi EKSKLUSIF khusus Super Admin (canAccessConfigMaster).
 */
export async function updateBrandIdentity(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah konfigurasi ini.");
  }

  const raw = {
    appName: formData.get("appName"),
    appTagline: formData.get("appTagline"),
    shortName: formData.get("shortName"),
    logoShape: formData.get("logoShape"),
  };

  const parsed = brandIdentitySchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Data identitas brand tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) {
    return actionError("Gagal menyimpan identitas brand ke server.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan/brand");

  return { ok: true, message: "Identitas brand berhasil disimpan." };
}

/**
 * Mengunggah berkas logo kustom perusahaan.
 */
export async function uploadBrandLogo(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengunggah logo.");
  }

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return actionError("Pilih berkas logo terlebih dahulu.");
  }

  const result = await saveBrandLogoFile(file, user.name);
  if (!result.ok) {
    return actionError(result.message || "Gagal menyimpan berkas logo.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan");
  revalidatePath("/pengaturan/brand");

  return { ok: true, message: "Logo brand berhasil diperbarui." };
}

/**
 * Menghapus logo kustom dan kembali ke lambang monogram "Rp" bawaan.
 */
export async function removeBrandLogo(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda tidak valid.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak menghapus logo.");
  }

  await deleteBrandLogoFile(user.name);

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan");
  revalidatePath("/pengaturan/brand");

  return { ok: true, message: "Logo brand berhasil dihapus. Sistem kembali ke lambang bawaan." };
}

/**
 * Mengunggah berkas maskot kustom perusahaan/aplikasi.
 */
export async function uploadBrandMascot(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah maskot.");
  }

  const file = formData.get("mascot") as File | null;
  if (!file || file.size === 0) {
    return actionError("Pilih berkas gambar maskot terlebih dahulu.");
  }

  const result = await saveBrandMascotFile(file, user.name);
  if (!result.ok) {
    return actionError(result.message || "Gagal menyimpan berkas maskot.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Karakter maskot brand berhasil diperbarui." };
}

/**
 * Menghapus maskot kustom dan kembali ke karakter bendahara 3D bawaan ("The Treasurer").
 */
export async function removeBrandMascot(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda tidak valid.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak menghapus maskot.");
  }

  await deleteBrandMascotFile(user.name);

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Maskot berhasil dikembalikan ke karakter bendahara 3D bawaan." };
}

/**
 * Mengatur ulang seluruh konfigurasi identitas dan logo kembali ke setelan awal.
 */
export async function resetBrandToDefault(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda tidak valid.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mereset identitas brand.");
  }

  await resetBrandConfig();

  revalidatePath("/", "layout");
  revalidatePath("/login");
  revalidatePath("/pengaturan");
  revalidatePath("/pengaturan/brand");

  return { ok: true, message: "Seluruh konfigurasi brand telah direset ke setelan awal." };
}

/**
 * Memperbarui profil badan usaha / organisasi (Kop Laporan, Alamat, Kontak).
 */
export async function updateCompanyProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah profil badan usaha.");
  }

  const raw = {
    companyName: formData.get("companyName"),
    companyAddress: formData.get("companyAddress"),
    companyPhone: formData.get("companyPhone"),
    companyEmail: formData.get("companyEmail"),
  };

  const parsed = companyProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Data profil badan usaha tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) {
    return actionError("Gagal menyimpan profil badan usaha ke server.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Profil badan usaha berhasil diperbarui." };
}

/**
 * Memperbarui preferensi keuangan dan sistem.
 */
export async function updateSystemPreferences(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah preferensi sistem.");
  }

  const raw = {
    budgetAlertThreshold: formData.get("budgetAlertThreshold"),
    requireProofForExpense: formData.get("requireProofForExpense") === "true",
  };

  const parsed = systemPreferencesSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Pengaturan preferensi tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) {
    return actionError("Gagal menyimpan preferensi sistem ke server.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Preferensi sistem & keuangan berhasil diperbarui." };
}

/**
 * Memperbarui aturan otorisasi & plafon approval pengeluaran.
 */
export async function updateApprovalRules(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah aturan approval.");
  }

  const raw = {
    directorApprovalThreshold: formData.get("directorApprovalThreshold"),
    autoApproveAdmin: formData.get("autoApproveAdmin") === "true",
    requireProofForExpense: formData.get("requireProofForExpense") === "true",
    budgetAlertThreshold: formData.get("budgetAlertThreshold"),
  };

  const parsed = approvalRulesSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Pengaturan aturan approval tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) return actionError("Gagal menyimpan aturan approval ke server.");

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Aturan approval & otorisasi transaksi berhasil disimpan." };
}

/**
 * Memperbarui rekening default, biaya transfer, dan tarif pajak.
 */
export async function updateFinanceDefaults(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah setelan keuangan.");
  }

  const raw = {
    defaultAccountId: formData.get("defaultAccountId"),
    defaultTransferFee: formData.get("defaultTransferFee"),
    defaultTaxRate: formData.get("defaultTaxRate"),
  };

  const parsed = financeDefaultsSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Setelan default rekening/pajak tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) return actionError("Gagal menyimpan setelan default ke server.");

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Setelan rekening bawaan, pajak, & biaya transfer berhasil disimpan." };
}

/**
 * Memperbarui integrasi bot notifikasi Telegram.
 */
export async function updateTelegramNotifications(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah integrasi Telegram.");
  }

  const raw = {
    telegramBotToken: formData.get("telegramBotToken"),
    telegramChatId: formData.get("telegramChatId"),
    notifyOnIncome: formData.get("notifyOnIncome") === "true",
    notifyOnExpensePending: formData.get("notifyOnExpensePending") === "true",
    notifyOnBudgetAlert: formData.get("notifyOnBudgetAlert") === "true",
  };

  const parsed = telegramNotificationSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Pengaturan notifikasi Telegram tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) return actionError("Gagal menyimpan pengaturan Telegram ke server.");

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Pengaturan notifikasi bot Telegram berhasil disimpan." };
}

/**
 * Memperbarui kunci API integrasi AI Vision (Anthropic Claude).
 */
export async function updateAiIntegration(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");
  if (!canAccessConfigMaster(user.role)) {
    return actionError("Akses ditolak: Hanya Super Admin yang berhak mengubah integrasi AI.");
  }

  const raw = {
    aiBaseUrl: formData.get("aiBaseUrl"),
    aiModelName: formData.get("aiModelName"),
    anthropicApiKey: formData.get("anthropicApiKey"),
  };

  const parsed = aiIntegrationSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return actionError(firstError || "Pengaturan AI tidak valid.");
  }

  const success = await saveBrandConfig(parsed.data, user.name);
  if (!success) return actionError("Gagal menyimpan konfigurasi AI ke server.");

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");

  return { ok: true, message: "Konfigurasi AI Router & Kunci API berhasil disimpan." };
}


