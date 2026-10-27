import Link from "next/link";
import { IconShield } from "@/components/Icons";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Tampilan untuk halaman yang hanya boleh dibuka Administrator.
 *
 * Menu staf sudah menyembunyikan tautannya, jadi ini hanya terlihat bila staf
 * membuka URL-nya langsung (bookmark, tautan lama). Server Action-nya sendiri
 * tetap ditolak oleh `adminGuard()` apa pun yang tampil di layar.
 */
export function AccessDenied() {
  return (
    <div className="animate-fade-up">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
          <IconShield className="h-6 w-6" />
        </span>

        <p className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">
          Akses terbatas
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Halaman ini khusus Administrator
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Staf dapat mencatat transaksi dan memantau statusnya di Jurnal Kas.
          Akun, pos anggaran, transfer, dan piutang dikelola Administrator.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonStyles("primary", "md")}>
            Ke dashboard
          </Link>
          <Link href="/transaksi" className={buttonStyles("secondary", "md")}>
            Lihat jurnal kas
          </Link>
        </div>
      </Card>
    </div>
  );
}
