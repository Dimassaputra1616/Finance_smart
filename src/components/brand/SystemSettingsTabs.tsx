"use client";

import { useEffect, useState } from "react";
import { BrandLogoSection } from "./BrandLogoSection";
import { BrandMascotSection } from "./BrandMascotSection";
import { BrandIdentityForm } from "./BrandIdentityForm";
import { BrandLivePreview } from "./BrandLivePreview";
import { CompanyProfileForm } from "./CompanyProfileForm";
import { ApprovalRulesForm } from "./ApprovalRulesForm";
import { FinanceDefaultsForm } from "./FinanceDefaultsForm";
import { TelegramNotificationForm } from "./TelegramNotificationForm";
import { BackupMaintenanceSection } from "./BackupMaintenanceSection";
import { AiIntegrationForm } from "./AiIntegrationForm";
import { MasterDataOverview } from "./MasterDataOverview";
import { Card, CardHeader } from "@/components/ui";
import { cx } from "@/components/ui/Card";
import {
  IconSparkle,
  IconReceipt,
  IconShield,
  IconWallet,
  IconMail,
  IconDownload,
  IconCategory,
} from "@/components/Icons";
import type { BrandConfig } from "@/lib/brand-config";

type TabKey =
  | "brand"
  | "company"
  | "approval"
  | "finance"
  | "telegram"
  | "ai"
  | "backup"
  | "master";

interface TabItem {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: typeof IconSparkle;
  description: string;
}

const TABS: TabItem[] = [
  {
    key: "brand",
    label: "Identitas & Logo Brand",
    shortLabel: "Logo & Brand",
    icon: IconSparkle,
    description: "Kustomisasi logo aplikasi, nama sistem, slogan, dan bentuk bingkai.",
  },
  {
    key: "company",
    label: "Profil Badan Usaha",
    shortLabel: "Perusahaan",
    icon: IconReceipt,
    description: "Nama resmi organisasi, alamat domisili, dan narahubung kantor.",
  },
  {
    key: "approval",
    label: "Approval & Otorisasi",
    shortLabel: "Approval",
    icon: IconShield,
    description: "Batas plafon persetujuan Direktur dan kebijakan nota pengeluaran.",
  },
  {
    key: "finance",
    label: "Rekening & Pajak",
    shortLabel: "Rekening & Pajak",
    icon: IconWallet,
    description: "Rekening kas utama bawaan, biaya transfer standar, dan tarif PPN.",
  },
  {
    key: "telegram",
    label: "Notifikasi Telegram",
    shortLabel: "Telegram",
    icon: IconMail,
    description: "Integrasi bot notifikasi transaksi masuk, pending approval, & pagu.",
  },
  {
    key: "ai",
    label: "Integrasi AI Vision",
    shortLabel: "AI Scanner",
    icon: IconSparkle,
    description: "Kunci API Anthropic Claude Vision untuk pemindaian struk otomatis.",
  },
  {
    key: "backup",
    label: "Cadangan & Database",
    shortLabel: "Backup Data",
    icon: IconDownload,
    description: "Unduh cadangan database lengkap 1-klik dan statistik buku kas.",
  },
  {
    key: "master",
    label: "Pusat Data Master",
    shortLabel: "Data Master",
    icon: IconCategory,
    description: "Akses cepat ke pos anggaran, rekening bank/kas, dan manajemen pengguna.",
  },
];

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface DatabaseStats {
  accountCount: number;
  categoryCount: number;
}

/**
 * Komponen Kontrol Navigasi Tab Master Config Terpadu (Lengkap & Komprehensif).
 */
export function SystemSettingsTabs({
  brand,
  isSuperAdmin = false,
  initialTab,
  accounts = [],
  stats,
}: {
  brand: BrandConfig;
  isSuperAdmin?: boolean;
  initialTab?: string;
  accounts?: AccountOption[];
  stats?: DatabaseStats;
}) {
  const isValidTab = (t?: string): t is TabKey =>
    t === "brand" ||
    t === "company" ||
    t === "approval" ||
    t === "finance" ||
    t === "telegram" ||
    t === "ai" ||
    t === "backup" ||
    t === "master";

  const [activeTab, setActiveTab] = useState<TabKey>(
    isValidTab(initialTab) ? initialTab : "brand",
  );

  useEffect(() => {
    if (isValidTab(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-6">
      {/* Bilah Navigasi Tab Lengkap */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-border/80 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                "group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer min-h-11",
                isActive
                  ? "bg-sidebar-brand-from text-sidebar-brand-foreground shadow-xs"
                  : "bg-surface text-muted-foreground border border-border/80 hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon
                className={cx(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive ? "text-sidebar-brand-foreground" : "text-primary",
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Konten Tab 1: Identitas & Logo Brand */}
      {activeTab === "brand" && (
        <div className="space-y-6 animate-fade-in">
          <Card padded>
            <BrandLogoSection brand={brand} />
          </Card>

          <Card padded>
            <BrandMascotSection brand={brand} />
          </Card>

          <Card>
            <CardHeader
              title="Data Identitas Perusahaan / Brand"
              description="Nama dan slogan yang ditampilkan di bilah samping, header ponsel, dan halaman masuk."
            />
            <div className="p-5">
              <BrandIdentityForm brand={brand} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Pratinjau Visual Antarmuka"
              description="Lihat bagaimana logo dan identitas brand Anda tampak pada antarmuka pengguna."
            />
            <div className="p-5">
              <BrandLivePreview brand={brand} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab 2: Profil Badan Usaha */}
      {activeTab === "company" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader
              title="Profil Badan Usaha & Administrasi"
              description="Informasi resmi badan usaha atau organisasi yang dipakai sebagai kop dokumen keuangan."
            />
            <div className="p-5">
              <CompanyProfileForm brand={brand} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab 3: Approval & Otorisasi Transaksi */}
      {activeTab === "approval" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader
              title="Aturan Otorisasi & Plafon Approval"
              description="Batas persetujuan Direktur, otorisasi otomatis Super Admin, dan aturan bukti nota."
            />
            <div className="p-5">
              <ApprovalRulesForm brand={brand} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab 4: Rekening Default & Pajak */}
      {activeTab === "finance" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader
              title="Rekening Utama, Biaya Transfer & Pajak"
              description="Atur rekening kas bawaan saat pencatatan transaksi baru dan standar biaya perbankan."
            />
            <div className="p-5">
              <FinanceDefaultsForm brand={brand} accounts={accounts} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab 5: Notifikasi Bot Telegram */}
      {activeTab === "telegram" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader
              title="Integrasi Bot Telegram Keuangan"
              description="Kirim notifikasi otomatis seketika ke grup Telegram tim keuangan kantor."
            />
            <div className="p-5">
              <TelegramNotificationForm brand={brand} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab: Integrasi AI Vision */}
      {activeTab === "ai" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader
              title="Integrasi Anthropic Claude Vision"
              description="Konfigurasi kunci API pemindai nota dan struk belanja otomatis."
            />
            <div className="p-5">
              <AiIntegrationForm brand={brand} />
            </div>
          </Card>
        </div>
      )}

      {/* Konten Tab 6: Cadangan & Pemeliharaan Database */}
      {activeTab === "backup" && (
        <div className="space-y-6 animate-fade-in">
          <Card padded>
            <div className="mb-4 space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Cadangan &amp; Pemeliharaan Database
              </h3>
              <p className="text-xs text-muted-foreground">
                Ekspor arsip cadangan digital lengkap dan amankan seluruh data keuangan kantor.
              </p>
            </div>
            <BackupMaintenanceSection stats={stats} />
          </Card>
        </div>
      )}

      {/* Konten Tab 7: Pusat Data Master */}
      {activeTab === "master" && (
        <div className="space-y-6 animate-fade-in">
          <Card padded>
            <div className="mb-4 space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Katalog Master Data Pembukuan
              </h3>
              <p className="text-xs text-muted-foreground">
                Kelola seluruh data acuan dasar yang menjadi fondasi pencatatan perbendaharaan kas.
              </p>
            </div>
            <MasterDataOverview isSuperAdmin={isSuperAdmin} />
          </Card>
        </div>
      )}
    </div>
  );
}
