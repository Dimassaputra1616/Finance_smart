"use client";

import { useState } from "react";
import { BrandMark } from "@/components/auth/BrandMark";
import { getBrandLogoUrl, getBrandMascotUrl, type BrandConfig } from "@/lib/brand-config";
import { cx } from "@/components/ui/Card";
import { IconDashboard, IconSun, IconSparkle } from "@/components/Icons";

/**
 * Pratinjau Interaktif Langsung (Live Visual Preview).
 * Memperlihatkan bagaimana logo dan nama brand tampak nyata pada:
 * 1. Bilah Samping Desktop (Sidebar)
 * 2. Header Layar Ponsel (Mobile Header)
 * 3. Gerbang Halaman Masuk (Login Vault Gate)
 */
export function BrandLivePreview({ brand }: { brand: BrandConfig }) {
  const [activeTab, setActiveTab] = useState<"sidebar" | "mobile" | "login">("sidebar");

  const logoUrl = getBrandLogoUrl(brand);
  const appName = brand.appName || "Nama Aplikasi";
  const appTagline = brand.appTagline || "Sistem Keuangan Internal";

  return (
    <div className="space-y-4">
      {/* Tab Pemilih Pratinjau */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("sidebar")}
          className={cx(
            "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer min-h-11",
            activeTab === "sidebar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Bilah Samping (Sidebar)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mobile")}
          className={cx(
            "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer min-h-11",
            activeTab === "mobile"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Header Ponsel (Mobile)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={cx(
            "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer min-h-11",
            activeTab === "login"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          Halaman Masuk (Login)
        </button>
      </div>

      {/* Konten Pratinjau */}
      <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-6">
        {activeTab === "sidebar" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Simulasi tampilan di bilah navigasi utama sebelah kiri:
            </p>
            <div className="mx-auto max-w-sm rounded-2xl border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-sidebar">
              <div className="flex items-center gap-3">
                <BrandMark
                  logoUrl={logoUrl}
                  hasCustomLogo={brand.hasCustomLogo}
                  shape={brand.logoShape}
                  className="h-10 w-10 text-sm shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold tracking-tight text-sidebar-foreground">
                    {appName}
                  </span>
                  <span className="block truncate text-xs text-sidebar-muted">
                    {appTagline}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1 border-t border-sidebar-border/60 pt-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-active px-3 py-2 text-xs font-semibold text-sidebar-foreground">
                  <IconDashboard className="h-4 w-4 text-sidebar-brand-from" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-sidebar-muted">
                  <IconSparkle className="h-4 w-4" />
                  <span>Identitas Brand</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "mobile" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Simulasi tampilan header atas pada layar ponsel (PWA):
            </p>
            <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <BrandMark
                    logoUrl={logoUrl}
                    hasCustomLogo={brand.hasCustomLogo}
                    shape={brand.logoShape}
                    className="h-8 w-8 text-[0.65rem] shadow-xs"
                  />
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {appName}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface-muted text-muted-foreground">
                    <IconSun className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "login" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Simulasi tampilan identitas pada panel halaman login dan gerbang masuk:
            </p>
            <div className="mx-auto max-w-sm rounded-2xl border border-sidebar-border bg-sidebar p-6 text-center text-sidebar-foreground shadow-card">
              <div className="mx-auto flex flex-col items-center gap-2.5">
                <BrandMark
                  logoUrl={logoUrl}
                  hasCustomLogo={brand.hasCustomLogo}
                  shape={brand.logoShape}
                  className="h-14 w-14 text-xl shadow-xl"
                />
                <div className="min-w-0">
                  <h4 className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
                    {appName}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-sidebar-muted">
                    {appTagline}
                  </p>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getBrandMascotUrl(brand)}
                  alt="Maskot"
                  className="h-28 w-auto object-contain my-1 drop-shadow-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
