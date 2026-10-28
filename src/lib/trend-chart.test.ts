import { describe, expect, it } from "vitest";
import {
  calculateCleanCeiling,
  calculateTrendLayout,
  type TrendDataPoint,
} from "./trend-chart";

describe("calculateCleanCeiling", () => {
  it("membulatkan nilai 0 atau negatif ke batas minimum 1 juta", () => {
    expect(calculateCleanCeiling(0)).toBe(1_000_000);
    expect(calculateCleanCeiling(-500_000)).toBe(1_000_000);
  });

  it("membulatkan angka ke batas kelipatan 1, 2, 5, atau 10 yang rapi", () => {
    expect(calculateCleanCeiling(850_000)).toBe(1_000_000);
    expect(calculateCleanCeiling(1_200_000)).toBe(2_000_000);
    expect(calculateCleanCeiling(3_400_000)).toBe(5_000_000);
    expect(calculateCleanCeiling(6_100_000)).toBe(10_000_000);
    expect(calculateCleanCeiling(18_000_000)).toBe(20_000_000);
    expect(calculateCleanCeiling(45_000_000)).toBe(50_000_000);
  });
});

describe("calculateTrendLayout", () => {
  const sampleData: TrendDataPoint[] = [
    {
      monthKey: "2026-05",
      label: "Mei",
      income: 15_000_000,
      expense: 8_000_000,
      net: 7_000_000,
    },
    {
      monthKey: "2026-06",
      label: "Jun",
      income: 20_000_000,
      expense: 22_000_000,
      net: -2_000_000,
    },
    {
      monthKey: "2026-07",
      label: "Jul",
      income: 0,
      expense: 0,
      net: 0,
    },
  ];

  it("menghasilkan layout dengan lebar bar <= 24px dan gap 2px", () => {
    const layout = calculateTrendLayout(sampleData, 600, 240);

    expect(layout.monthGroups).toHaveLength(3);
    for (const group of layout.monthGroups) {
      expect(group.incomeBar.width).toBeLessThanOrEqual(24);
      expect(group.expenseBar.width).toBeLessThanOrEqual(24);

      // Gap antara income dan expense = 2px
      const gap = group.expenseBar.x - (group.incomeBar.x + group.incomeBar.width);
      expect(gap).toBeCloseTo(2, 5);

      // Semua bar berakar di garis dasar baselineY (y + height === baselineY)
      expect(group.incomeBar.y + group.incomeBar.height).toBeCloseTo(
        layout.baselineY,
        5,
      );
      expect(group.expenseBar.y + group.expenseBar.height).toBeCloseTo(
        layout.baselineY,
        5,
      );
    }
  });

  it("menangani bulan dengan nilai 0 secara aman tanpa NaN", () => {
    const layout = calculateTrendLayout(sampleData, 600, 240);
    const zeroGroup = layout.monthGroups[2];

    expect(zeroGroup.incomeBar.height).toBe(0);
    expect(zeroGroup.expenseBar.height).toBe(0);
    expect(Number.isFinite(zeroGroup.incomeBar.y)).toBe(true);
    expect(Number.isFinite(zeroGroup.expenseBar.y)).toBe(true);
  });

  it("menghasilkan 3 garis acuan sumbu Y yang terdefinisi", () => {
    const layout = calculateTrendLayout(sampleData, 600, 240);

    expect(layout.yTicks).toHaveLength(3);
    expect(layout.yTicks[0].label).toBe("Rp 0");
    expect(layout.yTicks[2].value).toBe(layout.maxValue);
  });
});
