"use client";

import { useState } from "react";
import { IconDownload } from "@/components/Icons";
import { Button } from "@/components/ui";

interface DatabaseStats {
  accountCount: number;
  categoryCount: number;
}

/**
 * Komponen Cadangan & Pemeliharaan Database (1-Klik Download Backup).
 */
export function BackupMaintenanceSection({
  stats,
}: {
  stats?: DatabaseStats;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadBackup = () => {
    setIsDownloading(true);
    window.location.href = "/api/backup";
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner 1-Klik Backup */}
      <div className="rounded-2xl border border-border/80 bg-linear-to-br from-surface to-surface-muted/40 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Satu Sumber Kebenaran Data</span>
            </div>
            <h3 className="text-base font-bold text-foreground">
              Cadangan Database Terenkripsi (JSON Export)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Unduh salinan arsip digital lengkap seluruh buku kas: rekening aktif, pos anggaran,
              seluruh mutasi transaksi kas, rekonsiliasi piutang, dan konfigurasi master sistem.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            disabled={isDownloading}
            onClick={handleDownloadBackup}
            className="gap-2 min-h-11 shrink-0 px-5 shadow-md cursor-pointer"
          >
            <IconDownload className="h-4 w-4" />
            <span>{isDownloading ? "Menyiapkan File..." : "Unduh Cadangan (.json)"}</span>
          </Button>
        </div>
      </div>

      {/* Ringkasan Statistik Buku Kas */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Rekening Terdaftar</p>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">
            {stats?.accountCount ?? 0} Akun
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-xs">
          <p className="text-xs text-muted-foreground">Pos Anggaran Aktif</p>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">
            {stats?.categoryCount ?? 0} Pos
          </p>
        </div>
      </div>

      {/* Instruksi Backup Server Level */}
      <div className="rounded-2xl border border-border/60 bg-surface-muted/20 p-4 text-xs text-muted-foreground space-y-2">
        <h4 className="font-semibold text-foreground">Pencadangan Tingkat Server (CLI):</h4>
        <p className="leading-relaxed">
          Anda juga dapat menjalankan pencadangan fisik langsung dari terminal server menggunakan
          perintah otomatis:
        </p>
        <code className="block rounded-xl bg-surface p-2.5 font-mono text-[11px] text-foreground border border-border">
          npm run db:backup
        </code>
        <p className="text-[11px]">
          Salinan PostgreSQL/SQLite akan disimpan di folder privat <code>prisma/backups/</code> dengan
          stempel waktu otomatis.
        </p>
      </div>
    </div>
  );
}
