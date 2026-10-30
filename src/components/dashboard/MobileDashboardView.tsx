import Link from "next/link";
import { formatMonthLabel, shiftMonth, formatDateShort } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { isAccountType, ACCOUNT_TYPE_LABELS } from "@/lib/types";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconClock,
  IconPlus,
  IconReceivable,
  IconTransfer,
  IconWallet,
} from "@/components/Icons";
import { CashflowTrendChart } from "./CashflowTrendChart";
import { BudgetCard } from "./BudgetCard";
import { Card, CardHeader, EmptyState, buttonStyles, cx } from "@/components/ui";
import type { DashboardData } from "./types";

/**
 * Tampilan Dashboard Terdedikasi untuk Layar Ponsel & PWA (Progressive Web App).
 *
 * Dioptimalkan untuk navigasi jempol di smartphone:
 * - PWA Mobile Quick-Action Hub (Pintas catat kas, transfer, approval, piutang).
 * - Mobile Cashflow Cockpit (2-in-1 Compact Tile hemat ruang vertikal).
 * - Jurnal mutasi kas cepat dengan sentuhan ramah jempol.
 * - Ringkasan rekening operasional instan.
 */
export function MobileDashboardView({ data }: { data: DashboardData }) {
  const {
    monthKey,
    currentMonth,
    summary,
    sortedAccounts,
    recent,
    pending,
    budgets,
    trendData,
    canManage,
  } = data;

  return (
    <div className="space-y-4">
      {/* Header Periode Aktif & Pemilih Bulan Mobile */}
      <header className="flex items-center justify-between gap-2 pt-0.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Buku Kas
          </p>
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {formatMonthLabel(monthKey)}
          </h1>
        </div>

        {/* Pemilih Periode Kompak untuk HP */}
        <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-xs shrink-0">
          <Link
            href={`/?bulan=${shiftMonth(monthKey, -1)}`}
            aria-label="Periode lalu"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-hover active:scale-90 transition"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Link>

          {monthKey !== currentMonth ? (
            <Link
              href="/"
              className="px-2 py-1 text-[11px] font-bold text-primary active:scale-95 transition"
            >
              Kini
            </Link>
          ) : (
            <span className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground">
              Aktif
            </span>
          )}

          <Link
            href={`/?bulan=${shiftMonth(monthKey, 1)}`}
            aria-label="Periode depan"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-hover active:scale-90 transition"
          >
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* PWA Mobile Quick-Action Hub (Aksi Cepat Finansial) */}
      <div
        className={cx(
          "grid gap-2 pt-0.5",
          canManage ? "grid-cols-4" : "grid-cols-2",
        )}
      >
        <Link
          href="/transaksi/baru"
          className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition min-h-[4.5rem]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition">
            <IconPlus className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">Catat Kas</span>
        </Link>

        {canManage && (
          <Link
            href="/transaksi/transfer"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition min-h-[4.5rem]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-muted text-foreground border border-border shadow-xs group-hover:scale-105 transition">
              <IconTransfer className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">Transfer</span>
          </Link>
        )}

        <Link
          href="/transaksi?status=PENDING"
          className="group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition min-h-[4.5rem]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-warning-soft text-warning border border-warning/35 shadow-xs group-hover:scale-105 transition">
            <IconClock className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">Approval</span>
          {pending.count > 0 && (
            <span className="absolute top-1.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground shadow-xs">
              {pending.count}
            </span>
          )}
        </Link>

        {canManage && (
          <Link
            href="/piutang"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition min-h-[4.5rem]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-muted text-foreground border border-border shadow-xs group-hover:scale-105 transition">
              <IconReceivable className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">Piutang</span>
          </Link>
        )}
      </div>

      {/* Peringatan Approval Menggantung di Layar Ponsel */}
      {pending.count > 0 && (
        <Card className="flex items-center justify-between gap-3 border-l-4 border-l-warning p-3.5 bg-warning-soft/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
              <IconClock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                {pending.count} Transaksi Perlu Persetujuan Direktur
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Total: {formatRupiah(pending.totalExpense)}
              </p>
            </div>
          </div>
          <Link
            href="/transaksi?status=PENDING"
            className="shrink-0 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs active:scale-95 transition"
          >
            Review
          </Link>
        </Card>
      )}

      {/* Mobile Cashflow Cockpit: 2-in-1 Compact Tile */}
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground">Arus Kas Periode Ini</span>
          <span
            className={cx(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wide",
              summary.net >= 0
                ? "bg-income-soft text-income border border-income/30"
                : "bg-expense-soft text-expense border border-expense/30",
            )}
          >
            {summary.net >= 0 ? "Surplus +" : "Defisit −"}
            {formatRupiah(Math.abs(summary.net))}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-income/20 bg-income-soft/30 p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-income">
              <IconArrowDown className="h-3.5 w-3.5 rotate-180" />
              <span>Penerimaan</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tracking-tight text-income">
              {formatRupiah(summary.income)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {summary.transactionCount} mutasi masuk
            </p>
          </div>

          <div className="rounded-2xl border border-expense/20 bg-expense-soft/30 p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-expense">
              <IconArrowUp className="h-3.5 w-3.5" />
              <span>Pengeluaran</span>
            </div>
            <p className="mt-1 text-base font-bold font-mono tracking-tight text-expense">
              {formatRupiah(summary.expense)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Beban operasional</p>
          </div>
        </div>
      </div>

      {/* Grafik Tren Arus Kas 6 Bulan (Mobile Vector Scaled) */}
      <CashflowTrendChart data={trendData} currentMonthKey={monthKey} />

      {/* Pagu Anggaran Bulanan */}
      <BudgetCard rows={budgets} canManage={canManage} />

      {/* Jurnal Mutasi Kas Terkini (Stream Mode) */}
      <Card>
        <CardHeader
          title="Mutasi Kas Terkini"
          action={
            <Link href="/transaksi" className={buttonStyles("ghost", "sm")}>
              Lihat semua
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            compact
            title="Belum ada mutasi kas"
            description="Mutasi yang dicatat akan tampil di sini."
            action={
              <Link href="/transaksi/baru" className={buttonStyles("secondary", "sm")}>
                Catat mutasi kas
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((transaction) => (
              <li key={transaction.id} className="min-w-0">
                <Link
                  href={`/transaksi/${transaction.id}/edit`}
                  className="flex min-w-0 cursor-pointer items-center justify-between gap-3 px-4 py-3 active:bg-surface-hover transition"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {transaction.description}
                      </p>
                      <p className="truncate text-[10px] text-subtle-foreground mt-0.5">
                        {transaction.category.name} · {formatDateShort(transaction.occurredAt)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cx(
                      "shrink-0 text-xs font-bold tabular-nums font-mono",
                      transaction.kind === "INCOME" ? "text-income" : "text-foreground",
                    )}
                  >
                    {transaction.kind === "INCOME" ? "+" : "−"}
                    {formatRupiah(transaction.amount)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Ringkasan Saldo Rekening Bank & Kas */}
      <Card>
        <CardHeader
          title="Rekening Bank & Kas"
          action={
            canManage ? (
              <Link href="/akun" className={buttonStyles("ghost", "sm")}>
                Kelola
              </Link>
            ) : undefined
          }
        />
        {sortedAccounts.length === 0 ? (
          <EmptyState compact title="Belum ada akun terdaftar." />
        ) : (
          <ul className="divide-y divide-border">
            {sortedAccounts.map((account) => (
              <li
                key={account.id}
                className={cx(
                  "flex min-w-0 items-center justify-between gap-3 px-4 py-3",
                  account.isArchived && "opacity-60",
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                    <IconWallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {account.name}
                    </p>
                    <p className="truncate text-[10px] text-subtle-foreground">
                      {isAccountType(account.type)
                        ? ACCOUNT_TYPE_LABELS[account.type]
                        : account.type}
                    </p>
                  </div>
                </div>
                <p
                  className={cx(
                    "shrink-0 text-xs font-bold tabular-nums font-mono",
                    account.balance < 0 ? "text-expense" : "text-foreground",
                  )}
                >
                  {formatRupiah(account.balance)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
