import Link from "next/link";
import {
  getAccountBalances,
  getCategoryBreakdown,
  getMonthSummary,
  getRecentTransactions,
  getPendingSummary,
  getBudgetProgress,
} from "@/server/queries/finance";
import {
  getReceivableFlow,
  getReceivableSummary,
} from "@/server/queries/receivables";
import { getWealthSummary } from "@/server/queries/wealth";
import {
  formatDateShort,
  formatMonthLabel,
  getCurrentMonthKey,
  normalizeMonthKey,
  shiftMonth,
} from "@/lib/date";
import { formatRupiah, percentage } from "@/lib/money";
import { getCurrentUser } from "@/lib/session";
import { canManageMasterData } from "@/lib/transaction-rules";
import { ACCOUNT_TYPE_LABELS, isAccountType } from "@/lib/types";
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
  IconTransfer,
  IconWallet,
} from "@/components/Icons";
import { WealthCard } from "@/components/WealthCard";
import { TreasurerWelcomeCard } from "@/components/dashboard/TreasurerWelcomeCard";
import { BudgetCard } from "@/components/dashboard/BudgetCard";
import {
  Card,
  CardHeader,
  EmptyState,
  StatCard,
  buttonStyles,
  cx,
} from "@/components/ui";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const params = await searchParams;
  const monthKey = normalizeMonthKey(params.bulan);
  const currentMonth = getCurrentMonthKey();

  const [
    summary,
    expenseBreakdown,
    incomeBreakdown,
    accounts,
    recent,
    flow,
    piutang,
    wealth,
    pending,
    currentUser,
    budgets,
  ] = await Promise.all([
    getMonthSummary(monthKey),
    getCategoryBreakdown(monthKey, "EXPENSE"),
    getCategoryBreakdown(monthKey, "INCOME"),
    // Akun terarsip ikut diambil agar angka saldonya bisa diaudit di bawah.
    getAccountBalances({ includeArchived: true }),
    getRecentTransactions(5),
    getReceivableFlow(monthKey),
    getReceivableSummary(),
    getWealthSummary(),
    getPendingSummary(),
    getCurrentUser(),
    getBudgetProgress(monthKey),
  ]);

  const maxFlow = Math.max(summary.income, summary.expense, 1);
  const realExpense = summary.expense - flow.lent;
  // Transfer dan Piutang khusus Administrator; staf tidak diberi pintasannya.
  const canManage = canManageMasterData(currentUser?.role);

  // Akun aktif didahulukan, akun terarsip ditaruh paling bawah.
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <WealthCard
        wealth={wealth}
        overdueCount={piutang.overdueCount}
        overdueAmount={piutang.overdueAmount}
      />

      {/* Header Periode Aktif & Pemilih Bulan (Ditaruh tepat di atas aksi agar konteks waktu jelas di awal) */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">
            Perbendaharaan & Kas Kantor
          </p>
          <h1 className="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            {formatMonthLabel(monthKey)}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-2xs">
            <MonthLink
              monthKey={shiftMonth(monthKey, -1)}
              label="Periode lalu"
              icon={<IconArrowLeft className="h-3.5 w-3.5" />}
            />
            {monthKey !== currentMonth ? (
              <Link href="/" className="px-2.5 py-1 text-xs font-semibold text-primary hover:underline">
                Bulan Ini
              </Link>
            ) : null}
            <MonthLink
              monthKey={shiftMonth(monthKey, 1)}
              label="Periode depan"
              icon={<IconArrowRight className="h-3.5 w-3.5" />}
            />
          </div>

          <a
            href={`/api/export/transaksi?bulan=${monthKey}`}
            download
            className={cx(buttonStyles("secondary", "sm"), "hidden sm:inline-flex min-h-11 gap-1.5")}
            title="Unduh laporan mutasi kas periode ini (Excel .xls berformat tabel)"
          >
            <IconDownload className="h-4 w-4" />
            <span>Ekspor</span>
          </a>

          <Link
            href="/transaksi/baru"
            className={cx(buttonStyles("primary", "sm"), "hidden sm:inline-flex min-h-11 gap-1")}
          >
            <IconPlus className="h-4 w-4" />
            Catat Mutasi
          </Link>
        </div>
      </header>

      {/* PWA Mobile Quick-Action Dock (Native Mobile Fintech Hub) */}
      <div
        className={cx(
          "grid gap-2 pt-0.5 lg:hidden",
          canManage ? "grid-cols-4" : "grid-cols-2",
        )}
      >
        <Link
          href="/transaksi/baru"
          className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition">
            <IconPlus className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">Catat Kas</span>
        </Link>

        {canManage ? (
          <Link
            href="/transaksi/transfer"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-muted text-foreground border border-border shadow-xs group-hover:scale-105 transition">
              <IconTransfer className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">Transfer</span>
          </Link>
        ) : null}

        <Link
          href="/transaksi?status=PENDING"
          className="group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-warning-soft text-warning border border-warning/35 shadow-xs group-hover:scale-105 transition">
            <IconClock className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">Persetujuan</span>
          {pending.count > 0 && (
            <span className="absolute top-1.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground shadow-xs">
              {pending.count}
            </span>
          )}
        </Link>

        {canManage ? (
          <Link
            href="/piutang"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-xs active:scale-95 transition"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-muted text-foreground border border-border shadow-xs group-hover:scale-105 transition">
              <IconReceivable className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">Piutang</span>
          </Link>
        ) : null}
      </div>

      {pending.count > 0 ? (
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 border-l-warning p-4 bg-warning-soft/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
              <IconClock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {pending.count} Transaksi Menunggu Persetujuan
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Total pengeluaran diajukan:{" "}
                <strong className="text-foreground font-semibold">
                  {formatRupiah(pending.totalExpense)}
                </strong>
                . Saldo kas belum terpotong sebelum disetujui.
              </p>
            </div>
          </div>
          <Link
            href="/transaksi?status=PENDING"
            className={cx(buttonStyles("primary", "sm"), "shrink-0 min-h-11")}
          >
            Tinjau Sekarang →
          </Link>
        </Card>
      ) : null}

      {/* Kartu Sambutan Bendahara Digital (Tampil ramah saat kas baru / belum ada mutasi) */}
      <TreasurerWelcomeCard
        userName={currentUser?.name || "Bapak/Ibu"}
        hasTransactions={recent.length > 0}
      />

      {/* Mobile Cashflow Cockpit: 2-in-1 Tile (Kompak & Anti-Scroll Panjang di Ponsel) */}
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-card sm:hidden space-y-3">
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

      {/* Desktop StatCards (sm:grid ke atas) */}
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {flow.lent > 0 ? (
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
              className="inline-flex min-h-11 cursor-pointer items-center font-medium text-foreground underline underline-offset-2"
            >
              Lihat piutang
            </Link>
            .
          </p>
        </Card>
      ) : null}

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

      <BudgetCard rows={budgets} canManage={canManage} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Alokasi Pengeluaran per Pos Anggaran"
          rows={expenseBreakdown}
          emptyText="Belum ada beban operasional pada periode ini."
          emptyAction={
            <Link href="/transaksi/baru" className={buttonStyles("secondary", "sm")}>
              Catat pengeluaran pertama
            </Link>
          }
        />
        <BreakdownCard
          title="Sumber Penerimaan Kas Perusahaan"
          rows={incomeBreakdown}
          emptyText="Belum ada penerimaan kas pada periode ini."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Rekening Bank & Kas Operasional"
            description={`${wealth.accountCount} rekening aktif · Total likuiditas ${formatRupiah(wealth.cash)}`}
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
                    // `min-w-0` supaya baris boleh menyusut; tanpa itu, nama akun
                    // panjang membuat kartu ikut melebar dan halaman bisa
                    // digeser ke samping (lihat `scripts/audit-viewport.ts`).
                    "flex min-w-0 items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-surface-hover",
                    account.isArchived && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                      <IconWallet className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                        {account.name}
                        {account.isArchived ? (
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                            Diarsipkan
                          </span>
                        ) : null}
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
                      "shrink-0 text-sm font-semibold tabular-nums",
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

        <Card>
          <CardHeader
            title="Jurnal Mutasi Kas Terkini"
            action={
              <Link href="/transaksi" className={buttonStyles("ghost", "sm")}>
                Lihat semua
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              withCharacter
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
                        className="h-9 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor: transaction.category.color,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {transaction.description}
                        </p>
                        <p className="truncate text-xs text-subtle-foreground">
                          {transaction.category.name} · {transaction.account.name}{" "}
                          · {formatDateShort(transaction.occurredAt)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={cx(
                        "shrink-0 text-sm font-semibold tabular-nums",
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
      </div>
    </div>
  );
}

function MonthLink({
  monthKey,
  label,
  icon,
}: {
  monthKey: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={`/?bulan=${monthKey}`}
      aria-label={label}
      title={label}
      className={buttonStyles("secondary", "sm")}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
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
  const share = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className={cx("font-semibold tabular-nums", textClass)}>
          {formatRupiah(value)}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cx(
            "animate-grow h-full origin-left rounded-full transition-[width] duration-700",
            barClass,
          )}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}

type BreakdownRow = {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  count: number;
};

function BreakdownCard({
  title,
  rows,
  emptyText,
  emptyAction,
}: {
  title: string;
  rows: BreakdownRow[];
  emptyText: string;
  emptyAction?: React.ReactNode;
}) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <Card>
      <CardHeader title={title} description={`Total ${formatRupiah(total)}`} />
      {rows.length === 0 ? (
        <EmptyState compact title={emptyText} action={emptyAction} />
      ) : (
        <ul className="space-y-4 p-5">
          {rows.map((row) => (
            <li key={row.categoryId}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="truncate font-medium text-foreground">
                    {row.name}
                  </span>
                  <span className="shrink-0 text-xs text-subtle-foreground">
                    {row.count} kali
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {formatRupiah(row.total)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="animate-grow h-full origin-left rounded-full transition-[width] duration-700"
                    style={{
                      width: `${percentage(row.total, total)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-subtle-foreground">
                  {percentage(row.total, total)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}