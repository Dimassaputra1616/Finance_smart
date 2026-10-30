import type { SessionUser } from "@/lib/auth";
import type {
  AccountBalance,
  CategoryBreakdown,
  MonthSummary,
  PendingSummary,
  RecentTransaction,
} from "@/server/queries/finance";
import type { ReceivableFlow, ReceivableSummary } from "@/server/queries/receivables";
import type { WealthSummary } from "@/server/queries/wealth";
import type { BudgetProgressRow } from "@/server/queries/budget";
import type { CashflowTrendPoint } from "@/server/queries/cashflow-trend";

export interface DashboardData {
  monthKey: string;
  currentMonth: string;
  summary: MonthSummary;
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  accounts: AccountBalance[];
  sortedAccounts: AccountBalance[];
  recent: RecentTransaction[];
  flow: ReceivableFlow;
  piutang: ReceivableSummary;
  wealth: WealthSummary;
  pending: PendingSummary;
  currentUser: SessionUser | null;
  budgets: BudgetProgressRow[];
  trendData: CashflowTrendPoint[];
  maxFlow: number;
  realExpense: number;
  canManage: boolean;
}
