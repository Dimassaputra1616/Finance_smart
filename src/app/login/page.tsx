import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/auth/BrandMark";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginShowcase } from "@/components/auth/LoginShowcase";
import { VaultGate } from "@/components/auth/VaultGate";
import { APP_NAME } from "@/lib/brand";
import { getBrandLogoUrl } from "@/lib/brand-config";
import { getBrandConfig } from "@/server/brand-storage";

// Judul tab menjadi "Masuk · Perbendaharaan & Kas" lewat template di root layout.
export const metadata: Metadata = { title: "Masuk ke Konsol" };

/**
 * Halaman masuk: Terbuka, bersih, proporsional, dan bernuansa enterprise.
 *
 * Di desktop (lg), tinggi dikunci tepat setinggi layar (h-dvh) dan TIDAK BOLEH scroll.
 * Padding vertikal diselaraskan presisi dengan panel kiri agar garis pembatas
 * dan teks footer berada di satu garis lurus horizontal sempurna (100% pixel alignment).
 */
export default async function LoginPage() {
  const brand = await getBrandConfig();
  const appName = brand.appName ?? APP_NAME;
  const logoUrl = getBrandLogoUrl(brand);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground lg:h-dvh">
      <VaultGate brand={brand} />

      <div className="animate-vault-reveal flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
        <LoginShowcase brand={brand} />

        <main className="relative flex flex-1 flex-col justify-between overflow-hidden bg-surface px-6 py-6 text-foreground sm:px-10 lg:px-10 lg:py-7 xl:px-14 xl:py-8 2xl:px-20">
          {/* Subtle Ambient Depth di Latar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-sidebar-brand-from/10 blur-3xl transform-gpu"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-primary/8 blur-3xl transform-gpu"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Header Mobile & Pengalih Tema (Tinggi persis setara h-11) */}
          <div className="relative z-10 flex h-11 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <BrandMark
                logoUrl={logoUrl}
                hasCustomLogo={brand.hasCustomLogo}
                shape={brand.logoShape}
                className="h-9 w-9 text-xs"
              />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {appName}
              </span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Area Formulir Masuk: Rapi, Terbuka, Enterprise, Tanpa Scroll */}
          <div className="relative z-10 mx-auto my-auto w-full max-w-sm sm:max-w-md xl:max-w-md 2xl:max-w-lg py-2">
            <div className="mb-5 space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-income animate-pulse" />
                <span>Otentikasi Internal</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
                Masuk ke Konsol
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm xl:text-base">
                Akses konsol pengendalian perbendaharaan dan otorisasi anggaran.
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Footer Bawah (Presisi Sejajar Horisontal dengan Panel Kiri) */}
          <div className="relative z-10 flex h-6 items-center justify-between border-t border-border pt-3.5 text-[11px] text-subtle-foreground">
            <span className="font-medium">Sistem Informasi Perbendaharaan</span>
            <span className="font-mono">Sesi Terenkripsi</span>
          </div>
        </main>
      </div>
    </div>
  );
}
