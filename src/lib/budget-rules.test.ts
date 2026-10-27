import { describe, expect, it } from "vitest";
import { MAX_RUPIAH } from "./money";
import {
  BUDGET_WARNING_PERCENT,
  calcBudgetProgress,
  normalizeBudget,
} from "./budget-rules";

describe("calcBudgetProgress — status", () => {
  it("aman saat belum ada pengeluaran", () => {
    const res = calcBudgetProgress(0, 1_000);
    expect(res.status).toBe("safe");
    expect(res.percent).toBe(0);
    expect(res.barPercent).toBe(0);
    expect(res.remaining).toBe(1_000);
    expect(res.overBy).toBe(0);
  });

  it("masih aman sedikit di bawah 75%", () => {
    // 749 dari 1000 = 74,9%
    expect(calcBudgetProgress(749, 1_000).status).toBe("safe");
  });

  it("tidak salah masuk warning karena pembulatan persen", () => {
    // 74,96% dibulatkan jadi 75,0 oleh `percentage`, tapi tetap di bawah ambang.
    const res = calcBudgetProgress(74_960, 100_000);
    expect(res.percent).toBe(75);
    expect(res.status).toBe("safe");
  });

  it("warning tepat di ambang 75%", () => {
    expect(BUDGET_WARNING_PERCENT).toBe(75);
    expect(calcBudgetProgress(750, 1_000).status).toBe("warning");
  });

  it("pagu yang habis pas belum dianggap terlampaui", () => {
    const res = calcBudgetProgress(1_000, 1_000);
    expect(res.status).toBe("warning");
    expect(res.percent).toBe(100);
    expect(res.remaining).toBe(0);
    expect(res.overBy).toBe(0);
  });

  it("over begitu melewati pagu walau hanya Rp 1", () => {
    const res = calcBudgetProgress(1_001, 1_000);
    expect(res.status).toBe("over");
    expect(res.overBy).toBe(1);
    expect(res.remaining).toBe(0);
  });
});

describe("calcBudgetProgress — angka tampilan", () => {
  it("bar tidak melebihi 100% walau pengeluaran jauh di atas pagu", () => {
    const res = calcBudgetProgress(1_500, 1_000);
    expect(res.percent).toBe(150);
    expect(res.barPercent).toBe(100);
    expect(res.overBy).toBe(500);
  });

  it("menghitung sisa pagu", () => {
    const res = calcBudgetProgress(250_000, 1_000_000);
    expect(res.percent).toBe(25);
    expect(res.remaining).toBe(750_000);
  });

  it("aman di batas Int 32-bit tanpa NaN", () => {
    const res = calcBudgetProgress(MAX_RUPIAH, MAX_RUPIAH);
    expect(res.status).toBe("warning");
    expect(res.percent).toBe(100);
    expect(Number.isFinite(res.percent)).toBe(true);
    expect(res.overBy).toBe(0);
  });

  it("pagu nol atau negatif tidak menghasilkan NaN", () => {
    const none = calcBudgetProgress(0, 0);
    expect(none.status).toBe("safe");
    expect(none.percent).toBe(0);

    const spent = calcBudgetProgress(500, 0);
    expect(spent.status).toBe("over");
    expect(Number.isNaN(spent.percent)).toBe(false);
    expect(spent.barPercent).toBe(100);

    expect(calcBudgetProgress(10, -5).status).toBe("over");
  });
});

describe("normalizeBudget", () => {
  it("mempertahankan pagu untuk kategori pengeluaran", () => {
    expect(normalizeBudget("EXPENSE", 5_000_000)).toBe(5_000_000);
    expect(normalizeBudget("EXPENSE", null)).toBeNull();
  });

  it("membuang pagu untuk kategori pemasukan", () => {
    expect(normalizeBudget("INCOME", 5_000_000)).toBeNull();
  });
});
