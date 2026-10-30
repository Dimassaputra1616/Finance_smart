import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { canAccessConfigMaster, canManageUsers } from "@/lib/transaction-rules";
import { getBrandConfig } from "@/server/brand-storage";
import { getAccountBalances } from "@/server/queries/finance";
import { db } from "@/lib/db";
import { SystemSettingsTabs } from "@/components/brand/SystemSettingsTabs";

export const metadata = { title: "Config Master" };

export const dynamic = "force-dynamic";

/**
 * Halaman Utama Config Master & Pengaturan Sistem.
 *
 * Pusat kendali identitas merek, logo kustom, profil badan usaha,
 * preferensi pagu anggaran, aturan approval, rekening bawaan, dan navigasi data master.
 * Hak akses EKSKLUSIF hanya untuk Super Admin (ADMIN).
 */
export default async function ConfigMasterPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canAccessConfigMaster(user.role)) {
    redirect("/");
  }

  const [brand, params, accounts, accountCount, categoryCount] = await Promise.all([
    getBrandConfig(),
    searchParams,
    getAccountBalances(),
    db.account.count(),
    db.category.count(),
  ]);
  const isSuperAdmin = canManageUsers(user.role);

  const accountOptions = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
  }));

  const stats = {
    accountCount,
    categoryCount,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      {/* Header Halaman Config Master */}
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-3 py-1 text-[11px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Pusat Kendali Pengaturan</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Config Master
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Kelola identitas brand, unggah logo kustom, atur profil badan usaha, tetapkan aturan
          approval transaksi, setelan rekening bawaan, dan integrasi notifikasi sistem.
        </p>
      </header>

      {/* Tab Kontrol Pengaturan Master */}
      <SystemSettingsTabs
        brand={brand}
        isSuperAdmin={isSuperAdmin}
        initialTab={params?.tab}
        accounts={accountOptions}
        stats={stats}
      />
    </div>
  );
}
