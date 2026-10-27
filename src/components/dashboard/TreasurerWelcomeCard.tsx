"use client";

import Link from "next/link";
import { TheTreasurer } from "@/components/illustrations/TheTreasurer";
import { IconPlus, IconReceipt } from "@/components/Icons";
import { buttonStyles, cx } from "@/components/ui";

/**
 * Kartu Sambutan Interaktif Bendahara Digital ("The Treasurer Card").
 *
 * Tampil elegan di dashboard PWA terutama saat buku kas masih baru / belum ada mutasi,
 * menggantikan kotak putih kosong yang kaku dengan kehadiran karakter hidup.
 */
export function TreasurerWelcomeCard({
  userName = "Pak Dimas",
  hasTransactions = false,
}: {
  userName?: string;
  hasTransactions?: boolean;
}) {
  // Hanya tampilkan jika buku kas masih baru (belum ada transaksi) agar relevan
  if (hasTransactions) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-card transition duration-300">
      {/* Pendaran Latar Belakang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-[#c49a45]/15"
      />

      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
        {/* Karakter Bendahara Digital Beranimasi */}
        <div className="shrink-0">
          <TheTreasurer size="md" />
        </div>

        {/* Dialog & Ajakan Bertindak */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-income animate-pulse" />
            <span>Asisten Perbendaharaan Aktif</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Buku Kas Siap Digunakan, {userName}!
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg">
            Semua rekening operasional dan pos anggaran kantor telah aktif. Rekam mutasi kas masuk atau jepret kuitansi nota pertama hari ini untuk mulai melihat grafik arus kas.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
            <Link
              href="/transaksi/baru"
              className={cx(
                buttonStyles("primary", "sm"),
                "min-h-10 gap-1.5 px-4 shadow-sm active:scale-95 transition",
              )}
            >
              <IconPlus className="h-4 w-4" />
              <span>Catat Mutasi Pertama</span>
            </Link>

            <Link
              href="/transaksi/baru"
              className={cx(
                buttonStyles("secondary", "sm"),
                "min-h-10 gap-1.5 px-3.5 border-border active:scale-95 transition",
              )}
            >
              <IconReceipt className="h-4 w-4 text-primary" />
              <span>Pindai Nota Struk</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TreasurerWelcomeCard;
