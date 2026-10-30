import { formatRupiah } from "@/lib/money";
import type { WealthSummary } from "@/lib/wealth";
import { IconAlert, IconReceivable, IconWallet, IconShield } from "@/components/Icons";

/**
 * Kartu Utama Dashboard: Posisi Likuiditas & Perbendaharaan Perusahaan.
 *
 * Mengusung estetika perbendaharaan perbankan korporat:
 * Menampilkan total aset likuid (Kas Operasional + Piutang Usaha yang dapat ditagih).
 */
export function WealthCard({
  wealth,
  overdueCount,
  overdueAmount,
}: {
  wealth: WealthSummary;
  overdueCount: number;
  overdueAmount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-[#12281e] via-[#163327] to-[#1e4233] p-6 text-[#f2f6f4] shadow-lifted sm:p-7">
      {/* Cahaya ambient emas sampanye halus di sudut kanan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#c49a45]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full border border-white/10"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs font-mono uppercase tracking-wider text-[#e8c77b]">
              <IconShield className="h-3.5 w-3.5" />
              Posisi Kas Riil
            </span>
            <span className="text-xs sm:text-sm text-white/75 font-mono">· Periode Berjalan</span>
          </div>

          <p className="rp-amount mt-2.5 text-[clamp(2rem,7vw,3.5rem)] font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl text-white">
            {formatRupiah(wealth.total)}
          </p>

          {wealth.isNegative ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs sm:text-sm text-[#fca5a5]">
              <IconAlert className="h-4 w-4 shrink-0" />
              Kewajiban atau penarikan kas melebihi saldo kas yang tercatat
            </p>
          ) : (
            <p className="mt-2.5 text-xs sm:text-sm text-white/90 leading-relaxed">
              Konsolidasi saldo {wealth.accountCount} rekening & kas operasional + piutang usaha tertagih
            </p>
          )}
        </div>

        {/* Breakdown Metrik Perbendaharaan: 1 Kolom di layar sangat sempit (<=375px), 2 Kolom di 380px+, horizontal di desktop */}
        <dl className="grid w-full grid-cols-1 min-[380px]:grid-cols-2 gap-4 pt-4 border-t border-white/10 sm:border-t-0 sm:pt-0 sm:flex sm:w-auto sm:shrink-0 sm:items-end sm:gap-8">
          <Breakdown
            icon={<IconWallet className="h-4 w-4 text-[#e8c77b]" />}
            label="Kas & Bank"
            value={formatRupiah(wealth.cash)}
            hint={
              wealth.archivedCount > 0
                ? `${wealth.accountCount} akun (${wealth.archivedCount} diarsipkan)`
                : `${wealth.accountCount} rekening aktif`
            }
          />

          <div
            className="hidden h-14 w-px bg-white/20 sm:block"
            aria-hidden="true"
          />

          <Breakdown
            icon={<IconReceivable className="h-4 w-4 text-[#e8c77b]" />}
            label="Piutang Usaha (AR)"
            value={formatRupiah(wealth.receivable)}
            hint={
              overdueCount > 0
                ? `${overdueCount} tagihan jatuh tempo (${formatRupiah(overdueAmount)})`
                : "Semua tagihan lancar"
            }
          />
        </dl>
      </div>
    </section>
  );
}

function Breakdown({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/85">
        {icon}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="rp-amount mt-1 text-xl sm:text-2xl font-bold tabular-nums text-white font-mono">
        {value}
      </dd>
      <p className="mt-0.5 text-xs sm:text-sm text-white/75 truncate">{hint}</p>
    </div>
  );
}
