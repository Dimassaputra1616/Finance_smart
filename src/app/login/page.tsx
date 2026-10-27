import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/auth/BrandMark";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginShowcase } from "@/components/auth/LoginShowcase";
import { VaultGate } from "@/components/auth/VaultGate";
import { APP_NAME } from "@/lib/brand";

// Judul tab menjadi "Masuk · Perbendaharaan & Kas" lewat template di root layout.
export const metadata: Metadata = { title: "Masuk" };

/**
 * Halaman masuk.
 *
 * Server Component. Hanya formulirnya (`LoginForm`), gerbang pembuka
 * (`VaultGate`), dan pengalih tema yang client; sisanya markup statis. Seluruh
 * warna memakai token semantik, jadi mode gelap ikut berubah dari satu tempat.
 *
 * Tidak boleh ada scroll. Di layar lebar (`lg`) tingginya dikunci tepat setinggi
 * layar dan setiap kolom mengatur isinya sendiri. Di ponsel tingginya hanya
 * MINIMAL setinggi layar, tidak dikunci: saat keyboard layar terbuka, area yang
 * terlihat menyusut dan halaman harus tetap bisa digulir supaya tombol Masuk
 * terjangkau (termasuk pada zoom 200%).
 */
export default function LoginPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground lg:h-dvh">
      <VaultGate />

      <div className="animate-vault-reveal flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
        <LoginShowcase />

        {/* `lg:overflow-y-auto` hanya jaring pengaman: kolom formulir pendek,
            jadi di keadaan normal tidak pernah menggulir. Tanpanya, zoom besar
            akan memotong tombol Masuk alih-alih menampilkan scroll. */}
        <main className="relative flex flex-1 flex-col bg-surface px-6 py-5 sm:px-10 lg:overflow-y-auto lg:px-16">
          <div className="flex items-center justify-between gap-3">
            {/* Panel kiri menyembunyikan mereknya di layar kecil, jadi ditaruh di sini. */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <BrandMark className="h-9 w-9 text-xs" />
              <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-sm py-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Masuk</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gunakan akun yang diberikan administrator.
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>
          </div>

          <p className="border-t border-border pt-3 text-xs text-subtle-foreground">
            Hanya untuk pengguna yang diberi akses.
          </p>
        </main>
      </div>
    </div>
  );
}
