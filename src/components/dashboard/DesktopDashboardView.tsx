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
  IconDownload,
  IconPlus,
  IconReceivable,
  IconScale,
  IconWallet,
} from "@/components/Icons";
import { CashflowTrendChart } from "./CashflowTrendChart";
import { BudgetCard } from "./BudgetCard";
import {
  Card,
  CardHeader,
  EmptyState,
  StatCard,
  buttonStyles,
  cx,
} from "@/components/ui";
import type { DashboardData } from "./types";
import type { CategoryBreakdown } from "@/server/queries/finance";

/**
 * Tampilan Dashboard Terdedikasi untuk Layar Komputer / Laptop (Desktop).
 *
 * Mengusung Tata Letak Bento Grid Modern & Rapi:
 * - Baris 1: Header periode aktif, pemilih bulan terpadu, tombol ekspor & aksi mutasi.
 * - Baris 2: 3 Kartu Metrik Utama (Inflow, Outflow, Surplus/Defisit) dengan aksen pendaran.
 * - Baris 3: Grid 2 Kolom Seimbang (Analisis Visual & Anggaran di Kiri, Aliran Operasional di Kanan).
 */
export function DesktopDashboardView({ data }: { data: DashboardData }) {
  const {
    monthKey,
    currentMonth,
    summary,
    expenseBreakdown,
    incomeBreakdown,
    sortedAccounts,
    recent,
    flow,
    wealth,
    pending,
    budgets,
    trendData,
    maxFlow,
    realExpense,
    canManage,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header Periode & Kontrol Aksi Terpadu */}
      <header className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-income animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Konsol Perbendaharaan Aktif
            </p>
          </div>
          <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {formatMonthLabel(monthKey)}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pemilih Periode Bulan Bergaya Pill Switcher */}
          <div className="flex items-center rounded-2xl border border-border bg-surface p-1 shadow-2xs">
            <Link
              href={`/?bulan=${shiftMonth(monthKey, -1)}`}
              aria-label="Periode lalu"
              title="Periode lalu"
              className={cx(
                buttonStyles("ghost", "sm"),
                "h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
              )}
            >
              <IconArrowLeft className="h-3.5 w-3.5" />
              <span>Lalu</span>
            </Link>

            <span className="h-4 w-px bg-border/80" />

            {monthKey !== currentMonth ? (
              <Link
                href="/"
                className="px-3 py-1.5 text-xs font-bold text-primary hover:underline transition"
              >
                Bulan Ini
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Bulan Ini
              </span>
            )}

            <span className="h-4 w-px bg-border/80" />

            <Link
              href={`/?bulan=${shiftMonth(monthKey, 1)}`}
              aria-label="Periode depan"
              title="Periode depan"
              className={cx(
                buttonStyles("ghost", "sm"),
                "h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Depan</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Tombol Ekspor Data */}
          <a
            href={`/api/export/transaksi?bulan=${monthKey}`}
            download
            className={cx(buttonStyles("secondary", "sm"), "h-11 px-4 gap-2 shadow-2xs")}
            title="Unduh laporan mutasi kas periode ini (Excel .xls berformat tabel)"
          >
            <IconDownload className="h-4 w-4" />
            <span>Ekspor</span>
          </a>

          {/* Tombol Catat Mutasi Baru */}
          <Link
            href="/transaksi/baru"
            className={cx(
              buttonStyles("primary", "sm"),
              "h-11 px-5 gap-2 shadow-sm font-semibold transition hover:scale-105 active:scale-95",
            )}
          >
            <IconPlus className="h-4 w-4" />
            <span>Catat Mutasi</span>
          </Link>
        </div>
      </header>

      {/* Banner Notifikasi Transaksi Menunggu Persetujuan (Pending Approval) */}
      {pending.count > 0 && (
        <Card className="flex items-center justify-between gap-4 border-l-4 border-l-warning p-4 bg-warning-soft/30 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
              <IconClock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                {pending.count} Transaksi Menunggu Persetujuan Direktur
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Total pengeluaran diajukan staf:{" "}
                <strong className="text-foreground font-semibold">
                  {formatRupiah(pending.totalExpense)}
                </strong>
                . Saldo kas belum terpotong sebelum disetujui.
              </p>
            </div>
          </div>
          <Link
            href="/transaksi?status=PENDING"
            className={cx(buttonStyles("primary", "sm"), "shrink-0 min-h-11 px-4")}
          >
            Tinjau Sekarang →
          </Link>
        </Card>
      )}

      {/* 3 Stat Cards Desktop (Penerimaan, Pengeluaran, Surplus/Defisit) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Penerimaan Kas (Inflow)"
          value={formatRupiah(summary.income)}
          tone="income"
          hint={`${summary.transactionCount} mutasi kas masuk periode ini`}
          icon={<IconArrowDown className="h-[1.15rem] w-[1.15rem]" />}
        />
        <StatCard
          label="Beban Kas Keluar (Outflow)"
          value={formatRupiah(summary.expense)}
          tone="expense"
          hint={
            flow.lent > 0
              ? `Setelah dikurangi ${formatRupiah(flow.lent)} piutang termin`
              : "Beban kas & operasional kantor"
          }
          icon={<IconArrowUp className="h-[1.15rem] w-[1.15rem]" />}
        />
        <StatCard
          label="Surplus / Defisit Kas"
          value={formatRupiah(summary.net)}
          tone={summary.net >= 0 ? "income" : "expense"}
          hint={
            flow.lent > 0
              ? `Beban kas riil ${formatRupiah(realExpense)}`
              : `Saldo kas perbendaharaan ${formatRupiah(wealth.cash)}`
          }
          icon={<IconScale className="h-[1.15rem] w-[1.15rem]" />}
        />
      </div>

      {/* Info Piutang Berjalan */}
      {flow.lent > 0 && (
        <Card className="flex items-start gap-3 border-l-4 border-l-warning p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
            <IconReceivable className="h-[1.15rem] w-[1.15rem]" />
          </span>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
            Pengeluaran bulan ini memuat{" "}
            <strong className="font-semibold text-foreground">
              {formatRupiah(flow.lent)}
            </strong>{" "}
            yang sebenarnya uang dipinjamkan, bukan dibelanjakan, jadi pengeluaran
            riilnya{" "}
            <strong className="font-semibold text-foreground">
              {formatRupiah(realExpense)}
            </strong>
            .{" "}
            {flow.repaid > 0 ? (
              <>
                Bulan ini juga menerima{" "}
                <strong className="font-semibold text-foreground">
                  {formatRupiah(flow.repaid)}
                </strong>{" "}
                pembayaran piutang.{" "}
              </>
            ) : null}
            <Link
              href="/piutang"
              className="inline-flex min-h-11 cursor-pointer items-center font-medium text-foreground underline underline-offset-2 ml-1"
            >
              Lihat piutang
            </Link>
          </p>
        </Card>
      )}

      {/* ======================================================== */}
      {/* BENTO GRID 2-KOLOM: ANALISIS DI KIRI, OPERASIONAL DI KANAN*/}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* -------------------------------------------------------- */}
        {/* KOLOM KIRI (7/12): VISUAL ANALYTICS & PAGU ANGGARAN       */}
        {/* -------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">
          {/* Grafik Tren Arus Kas 6 Bulan Terakhir */}
          <CashflowTrendChart data={trendData} currentMonthKey={monthKey} />

          {/* Pagu Anggaran Bulanan */}
          <BudgetCard rows={budgets} canManage={canManage} />

          {/* Keseimbangan Arus Kas */}
          <Card>
            <CardHeader
              title="Keseimbangan Arus Kas Perbendaharaan"
              description="Perbandingan arus kas masuk dan beban kas operasional periode ini."
            />
            <div className="space-y-4 p-5">
              <FlowBar
                label="Penerimaan Kas"
                value={summary.income}
                max={maxFlow}
                barClass="bg-income"
                textClass="text-income"
              />
              <FlowBar
                label="Beban Pengeluaran"
                value={summary.expense}
                max={maxFlow}
                barClass="bg-expense"
                textClass="text-expense"
              />
            </div>
          </Card>
        </div>

        {/* -------------------------------------------------------- */}
        {/* KOLOM KANAN (5/12): JURNAL TERKINI & REKENING OPERASIONAL */}
        {/* -------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-6">
          {/* Jurnal Mutasi Kas Terkini */}
          <Card>
            <CardHeader
              title="Jurnal Mutasi Kas Terkini"
              action={
                <Link href="/transaksi" className={buttonStyles("ghost", "sm")}>
                  Lihat semua →
                </Link>
              }
            />
            {recent.length === 0 ? (
              <EmptyState
                compact
                title="Belum ada mutasi kas"
                description="Mutasi kas masuk dan keluar yang tercatat akan tampil di sini."
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
                      className="flex min-w-0 cursor-pointer items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-surface-hover"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="h-9 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: transaction.category.color,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {transaction.description}
                          </p>
                          <p className="truncate text-xs text-subtle-foreground mt-0.5">
                            {transaction.category.name} · {transaction.account.name}{" "}
                            · {formatDateShort(transaction.occurredAt)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cx(
                          "shrink-0 text-sm font-bold tabular-nums font-mono",
                          transaction.kind === "INCOME"
                            ? "text-income"
                            : "text-foreground",
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

          {/* Rekening Bank & Kas Operasional */}
          <Card>
            <CardHeader
              title="Rekening Bank & Kas Operasional"
              description={`${wealth.accountCount} rekening aktif · Likuiditas ${formatRupiah(wealth.cash)}`}
              action={
                canManage ? (
                  <Link href="/akun" className={buttonStyles("ghost", "sm")}>
                    Kelola →
                  </Link>
                ) : undefined
              }
            />
            {sortedAccounts.length === 0 ? (
              <EmptyState
                compact
                title="Belum ada akun"
                description={
                  canManage
                    ? "Tambahkan akun untuk mulai mencatat transaksi."
                    : "Belum ada rekening atau kas operasional yang terdaftar. Hubungi Administrator."
                }
                action={
                  canManage ? (
                    <Link href="/akun" className={buttonStyles("secondary", "sm")}>
                      Kelola akun
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {sortedAccounts.map((account) => (
                  <li
                    key={account.id}
                    className={cx(
                      "flex min-w-0 items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-hover",
                      account.isArchived && "opacity-60",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                        <IconWallet className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                          {account.name}
                          {account.isArchived && (
                            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                              Diarsipkan
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-subtle-foreground">
                          {isAccountType(account.type)
                            ? ACCOUNT_TYPE_LABELS[account.type]
                            : account.type}
                        </p>
                      </div>
                    </div>
                    <p
                      className={cx(
                        "shrink-0 text-sm font-bold tabular-nums font-mono",
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

          {/* Alokasi Pengeluaran per Pos Anggaran */}
          <BreakdownCard
            title="Alokasi Beban per Pos Anggaran"
            rows={expenseBreakdown}
            emptyText="Belum ada beban operasional pada periode ini."
            emptyAction={
              <Link href="/transaksi/baru" className={buttonStyles("secondary", "sm")}>
                Catat pengeluaran pertama
              </Link>
            }
          />

          {/* Sumber Penerimaan Kas Perusahaan */}
          <BreakdownCard
            title="Sumber Penerimaan Kas"
            rows={incomeBreakdown}
            emptyText="Belum ada penerimaan kas pada periode ini."
          />
        </div>
      </div>
    </div>
  );
}

function FlowBar({
  label,
  value,
  max,
  barClass,
  textClass,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  textClass: string;
}) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
        <span className="text-foreground">{label}</span>
        <span className={cx("font-bold font-mono", textClass)}>
          {formatRupiah(value)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cx("h-full rounded-full transition-all duration-500", barClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  emptyText,
  emptyAction,
}: {
  title: string;
  rows: CategoryBreakdown[];
  emptyText: string;
  emptyAction?: React.ReactNode;
}) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.amount), 0);

  return (
    <Card>
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <EmptyState compact title={emptyText} action={emptyAction} />
      ) : (
        <div className="space-y-3.5 p-5">
          {rows.map((row) => {
            const percent = max > 0 ? Math.round((row.amount / max) * 100) : 0;
            return (
              <div key={row.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate font-medium text-foreground">
                      {row.name}
                    </span>
                  </div>
                  <span className="shrink-0 font-bold font-mono text-foreground">
                    {formatRupiah(row.amount)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
