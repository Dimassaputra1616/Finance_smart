import { percentage } from "./money";
import type { TransactionKind } from "./types";

/**
 * Aturan pagu (budget) bulanan per kategori pengeluaran.
 *
 * Murni, tanpa akses database (AGENTS.md §5), supaya batas-batasnya bisa diuji
 * langsung. Realisasi yang masuk ke sini sudah dihitung dari transaksi
 * APPROVED saja, lihat `getBudgetProgress()` di `src/server/queries/finance.ts`.
 */

export type BudgetStatus = "safe" | "warning" | "over";

/** Mulai dari persentase ini pagu dianggap mendekati batas. */
export const BUDGET_WARNING_PERCENT = 75;

export type BudgetProgress = {
  status: BudgetStatus;
  /** Persen terpakai, satu desimal. Boleh lebih dari 100 saat melewati pagu. */
  percent: number;
  /** Lebar bar 0 sampai 100. Bar tidak pernah melebihi wadahnya. */
  barPercent: number;
  /** Sisa pagu. Nol bila habis atau terlampaui. */
  remaining: number;
  /** Selisih di atas pagu. Nol bila belum melewati. */
  overBy: number;
};

export type BudgetRow = BudgetProgress & {
  categoryId: string;
  name: string;
  color: string;
  budget: number;
  spent: number;
};

/**
 * Hitung realisasi terhadap pagu.
 *
 * - `safe`: di bawah 75%
 * - `warning`: 75% sampai tepat 100% (pagu habis tapi belum terlampaui)
 * - `over`: lebih dari pagu
 */
export function calcBudgetProgress(spent: number, budget: number): BudgetProgress {
  const used = Math.max(0, spent);

  // Pagu nol atau negatif tidak valid dan tidak boleh menghasilkan NaN atau
  // Infinity di tampilan. Form sudah menolaknya; ini jaring pengaman terakhir.
  if (!(budget > 0)) {
    return {
      status: used > 0 ? "over" : "safe",
      percent: 0,
      barPercent: used > 0 ? 100 : 0,
      remaining: 0,
      overBy: used,
    };
  }

  // Status diputuskan dengan aritmetika bilangan bulat, bukan dari `percent`
  // yang sudah dibulatkan: 74,96% dibulatkan jadi 75,0% dan salah masuk
  // "warning". Perkalian paling besar sekitar 2,1e11, aman untuk double.
  let status: BudgetStatus = "safe";
  if (used > budget) status = "over";
  else if (used * 100 >= budget * BUDGET_WARNING_PERCENT) status = "warning";

  const percent = percentage(used, budget);

  return {
    status,
    percent,
    barPercent: Math.min(100, percent),
    remaining: Math.max(0, budget - used),
    overBy: Math.max(0, used - budget),
  };
}

/**
 * Pagu hanya bermakna untuk kategori PENGELUARAN. Kategori pemasukan selalu
 * disimpan tanpa pagu, apa pun isi form-nya.
 */
export function normalizeBudget(
  kind: TransactionKind,
  budget: number | null,
): number | null {
  return kind === "EXPENSE" ? budget : null;
}
