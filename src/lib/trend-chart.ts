import { formatRupiah } from "./money";

/**
 * Logika murni untuk menghitung geometri dan penskalaan grafik tren arus kas (SVG).
 *
 * Murni, tanpa dependensi DOM (AGENTS.md §5), agar dapat diuji secara
 * deterministik di vitest.
 */

export type TrendDataPoint = {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type BarGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MonthGroupGeometry = {
  monthKey: string;
  label: string;
  centerX: number;
  incomeBar: BarGeometry;
  expenseBar: BarGeometry;
  data: TrendDataPoint;
};

export type ChartLayout = {
  viewWidth: number;
  viewHeight: number;
  chartTop: number;
  chartBottom: number;
  chartHeight: number;
  baselineY: number;
  yTicks: Array<{ value: number; y: number; label: string }>;
  monthGroups: MonthGroupGeometry[];
  maxValue: number;
};

/**
 * Bulatkan nilai maksimum ke angka acuan terdekat yang rapi (1jt, 2jt, 5jt, 10jt, dst).
 */
export function calculateCleanCeiling(maxValue: number): number {
  if (maxValue <= 0) return 1_000_000;

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;

  let multiplier = 1;
  if (normalized <= 1) multiplier = 1;
  else if (normalized <= 2) multiplier = 2;
  else if (normalized <= 5) multiplier = 5;
  else multiplier = 10;

  return multiplier * magnitude;
}

/**
 * Hitung koordinat tata letak SVG grafik batang 6 bulan.
 *
 * Mengikuti spesifikasi dataviz skill:
 * - Lebar bar per series <= 24px (diset 14px agar proporsional dan ada ruang negatif).
 * - Gap 2px antar bar berpasangan.
 * - Sumbu Y bersih dengan 3 garis acuan (0, 50%, 100%).
 */
export function calculateTrendLayout(
  points: TrendDataPoint[],
  width = 600,
  height = 240,
): ChartLayout {
  const chartTop = 24;
  const chartBottom = height - 36;
  const chartHeight = chartBottom - chartTop;
  const baselineY = chartBottom;

  const rawMax = Math.max(
    ...points.map((p) => Math.max(p.income, p.expense)),
    1,
  );
  const maxValue = calculateCleanCeiling(rawMax);

  // 3 Ticks: 0, 50%, 100%
  const yTicks = [
    {
      value: 0,
      y: baselineY,
      label: "Rp 0",
    },
    {
      value: maxValue / 2,
      y: chartTop + chartHeight / 2,
      label: formatRupiah(maxValue / 2),
    },
    {
      value: maxValue,
      y: chartTop,
      label: formatRupiah(maxValue),
    },
  ];

  const paddingLeft = 56;
  const paddingRight = 16;
  const plotWidth = width - paddingLeft - paddingRight;

  const count = Math.max(points.length, 1);
  const step = plotWidth / count;
  const barWidth = 14;
  const barGap = 2;

  const monthGroups: MonthGroupGeometry[] = points.map((data, index) => {
    const centerX = paddingLeft + index * step + step / 2;

    const incomeHeight =
      maxValue > 0 ? (data.income / maxValue) * chartHeight : 0;
    const expenseHeight =
      maxValue > 0 ? (data.expense / maxValue) * chartHeight : 0;

    const clampedIncomeH = Math.max(0, Math.min(chartHeight, incomeHeight));
    const clampedExpenseH = Math.max(0, Math.min(chartHeight, expenseHeight));

    // Pasangan bar: income di kiri, expense di kanan
    const incomeX = centerX - barWidth - barGap / 2;
    const expenseX = centerX + barGap / 2;

    return {
      monthKey: data.monthKey,
      label: data.label,
      centerX,
      incomeBar: {
        x: incomeX,
        y: baselineY - clampedIncomeH,
        width: barWidth,
        height: clampedIncomeH,
      },
      expenseBar: {
        x: expenseX,
        y: baselineY - clampedExpenseH,
        width: barWidth,
        height: clampedExpenseH,
      },
      data,
    };
  });

  return {
    viewWidth: width,
    viewHeight: height,
    chartTop,
    chartBottom,
    chartHeight,
    baselineY,
    yTicks,
    monthGroups,
    maxValue,
  };
}
