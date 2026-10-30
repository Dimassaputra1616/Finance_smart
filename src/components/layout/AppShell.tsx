import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/session";
import { canManageMasterData, canManageUsers } from "@/lib/transaction-rules";
import { getBrandConfig } from "@/server/brand-storage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "./MobileNav";
import { SidebarNav } from "./SidebarNav";

/**
 * Kerangka halaman aplikasi enterprise.
 *
 * Di layar lebar, navigasi samping dikelola oleh `SidebarNav` (mendukung mode
 * diperluas dan kuncup, menampilkan profil user & role). Di layar kecil, navigasi
 * beralih ke `MobileNav`.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const [user, brand] = await Promise.all([
    getCurrentUser(),
    getBrandConfig(),
  ]);

  return (
    // `min-h-dvh`, bukan `min-h-screen`: di HP bilah alamat browser menambah
    // tinggi viewport saat menggulir, dan `100vh` memaksa halaman lebih tinggi
    // dari layar sehingga muncul ruang kosong di bawah.
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/*
        Skip link: fokus pertama di halaman ini melompat langsung ke konten,
        jadi pengguna keyboard tidak perlu menabrak sidebar dan header dulu.
        Disembunyikan sampai difokuskan, lalu melayang di atas segalanya.
      */}
      <a
        href="#konten-utama"
        className="sr-only rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lifted focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Lompat ke konten utama
      </a>

      <MobileNav
        user={user}
        canManage={canManageMasterData(user?.role)}
        canManageUsers={canManageUsers(user?.role)}
        brand={brand}
      />

      {/* Sidebar desktop */}
      <SidebarNav user={user} brand={brand} />

      {/* Tombol Pengalih Tema Melayang (Floating Glass Theme Toggle) di Layar Komputer */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:block">
        <ThemeToggle className="h-11 w-11 rounded-2xl border border-border/80 bg-surface/85 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-primary/40 hover:shadow-xl active:scale-95" />
      </div>

      {/*
        `tabIndex={-1}` supaya skip link benar-benar memindahkan fokus ke sini,
        bukan hanya mengubah posisi gulir. `focus:outline-none` dipakai karena
        elemen ini tidak boleh menampilkan cincin fokus saat fokus datang dari
        navigasi dalam aplikasi.
      */}
      <main
        id="konten-utama"
        tabIndex={-1}
        className="min-w-0 flex-1 focus:outline-none"
      >
        {/* Padding bawah ekstra di layar kecil untuk memberi ruang pada bilah
            tab fixed, supaya baris terakhir konten tidak tertutup. */}
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
