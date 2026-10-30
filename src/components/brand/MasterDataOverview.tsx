import Link from "next/link";
import {
  IconCategory,
  IconReceivable,
  IconUsers,
  IconWallet,
  IconArrowRight,
} from "@/components/Icons";

/**
 * Ringkasan & Akses Cepat ke Data Master Sistem.
 */
export function MasterDataOverview({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const masterLinks = [
    {
      title: "Pos Anggaran & Pagu",
      description: "Klasifikasi pos pemasukan & pengeluaran kas, serta penetapan plafon anggaran bulanan.",
      href: "/kategori",
      icon: IconCategory,
      badge: "Master Kategori",
    },
    {
      title: "Rekening Bank & Kas",
      description: "Daftar rekening bank operasional, e-wallet, brankas tunai, dan peran likuiditas.",
      href: "/akun",
      icon: IconWallet,
      badge: "Master Akun",
    },
    {
      title: "Piutang Usaha",
      description: "Buku pinjaman pihak ketiga, jatuh tempo piutang, dan rekonsiliasi pengembalian kas.",
      href: "/piutang",
      icon: IconReceivable,
      badge: "Master Piutang",
    },
    ...(isSuperAdmin
      ? [
          {
            title: "Kelola Pengguna Sistem",
            description: "Daftar akun staf & direktur, hak akses otorisasi RBAC, dan reset kata sandi.",
            href: "/pengguna",
            icon: IconUsers,
            badge: "Super Admin",
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {masterLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-border/60 bg-surface-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {item.badge}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span>Buka Data Master</span>
              <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
