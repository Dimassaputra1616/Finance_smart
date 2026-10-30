import {
  getAccountBalances,
  getCategoryBreakdown,
  getMonthSummary,
  getRecentTransactions,
  getPendingSummary,
  getBudgetProgress,
  getCashflowTrend,
} from "@/server/queries/finance";
import {
  getReceivableFlow,
  getReceivableSummary,
} from "@/server/queries/receivables";
import { getWealthSummary } from "@/server/queries/wealth";
import { getCurrentMonthKey, normalizeMonthKey } from "@/lib/date";
import { getCurrentUser } from "@/lib/session";
import { canManageMasterData } from "@/lib/transaction-rules";
import { WealthCard } from "@/components/WealthCard";
import { DesktopDashboardView } from "@/components/dashboard/DesktopDashboardView";
import { MobileDashboardView } from "@/components/dashboard/MobileDashboardView";
import type { DashboardData } from "@/components/dashboard/types";

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
    // Akun terarsip ikut diambil agar angka saldonya bisa diaudit
    accounts,
    recent,
    flow,
    piutang,
    wealth,
    pending,
    currentUser,
    budgets,
    trendData,
  ] = await Promise.all([
    getMonthSummary(monthKey),
    getCategoryBreakdown(monthKey, "EXPENSE"),
    getCategoryBreakdown(monthKey, "INCOME"),
    getAccountBalances({ includeArchived: true }),
    getRecentTransactions(5),
    getReceivableFlow(monthKey),
    getReceivableSummary(),
    getWealthSummary(),
    getPendingSummary(),
    getCurrentUser(),
    getBudgetProgress(monthKey),
    getCashflowTrend(monthKey, 6),
  ]);

  const maxFlow = Math.max(summary.income, summary.expense, 1);
  const realExpense = summary.expense - flow.lent;
  const canManage = canManageMasterData(currentUser?.role);

  // Akun aktif didahulukan, akun terarsip ditaruh paling bawah
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
    return 0;
  });

  const dashboardData: DashboardData = {
    monthKey,
    currentMonth,
    summary,
    expenseBreakdown,
    incomeBreakdown,
    accounts,
    sortedAccounts,
    recent,
    flow,
    piutang,
    wealth,
    pending,
    currentUser,
    budgets,
    trendData,
    maxFlow,
    realExpense,
    canManage,
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Kartu Posisi Kas Riil (Konsolidasi Saldo & Piutang) */}
      <WealthCard
        wealth={wealth}
        overdueCount={piutang.overdueCount}
        overdueAmount={piutang.overdueAmount}
      />

      {/* 1. Tampilan Desktop (Komputer / Laptop / Layar Lebar) */}
      <div className="hidden lg:block">
        <DesktopDashboardView data={dashboardData} />
      </div>

      {/* 2. Tampilan Khusus Mobile PWA (Ponsel Smartphone / Tablet) */}
      <div className="block lg:hidden">
        <MobileDashboardView data={dashboardData} />
      </div>
    </div>
  );
}
