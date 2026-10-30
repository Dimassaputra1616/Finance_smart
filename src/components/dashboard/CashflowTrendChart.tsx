"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/money";
import {
  calculateTrendLayout,
  type TrendDataPoint,
} from "@/lib/trend-chart";
import { Card, CardHeader, cx } from "@/components/ui";

/**
 * Komponen Visualisasi Grafik Tren Arus Kas 6 Bulan Terakhir.
 *
 * Dibangun mengikuti pedoman dataviz:
 * - Bentuk: Grouped Column Chart berpasangan (Penerimaan vs Pengeluaran).
 * - Mark: Lebar bar 14px (<= 24px), radius 4px di ujung data dan persegi di garis dasar.
 * - Spacing: Celah 2px antar bar berpasangan.
 * - Warna: Menggunakan token semantik CSS `var(--income)` dan `var(--expense)`.
 * - Interaksi: Layer hit-target responsif dengan tooltip terpadu per bulan.
 * - Aksesibilitas: Dilengkapi tabulasi data alternatif yang dapat dibuka kapan saja.
 */
export function CashflowTrendChart({
  data,
  currentMonthKey,
}: {
  data: TrendDataPoint[];
  currentMonthKey: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const viewWidth = 640;
  const viewHeight = 240;
  const layout = calculateTrendLayout(data, viewWidth, viewHeight);

  const activeGroup =
    hoveredIndex !== null && layout.monthGroups[hoveredIndex]
      ? layout.monthGroups[hoveredIndex]
      : null;

  const hasAnyData = data.some((p) => p.income > 0 || p.expense > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Tren Arus Kas 6 Bulan Terakhir"
        description="Perbandingan realisasi kas masuk dan beban operasional bulanan."
        action={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm bg-income"
              />
              <span>Penerimaan</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm bg-expense"
              />
              <span>Pengeluaran</span>
            </span>
          </div>
        }
      />

      <div className="p-5">
        {/* Kontainer SVG Responsif */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${layout.viewWidth} ${layout.viewHeight}`}
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label="Grafik tren penerimaan dan pengeluaran kas 6 bulan terakhir"
          >
            {/* Garis Grid Horizontal (Hairline Recessive) */}
            {layout.yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={56}
                  y1={tick.y}
                  x2={layout.viewWidth - 16}
                  y2={tick.y}
                  stroke="var(--border)"
                  strokeWidth={tick.value === 0 ? "1.5" : "1"}
                  strokeDasharray={tick.value === 0 ? undefined : "3 3"}
                  opacity={tick.value === 0 ? 1 : 0.6}
                />
                <text
                  x={50}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="fill-subtle-foreground font-mono text-[9px] tabular-nums"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Kolom Bar per Bulan */}
            {layout.monthGroups.map((group, index) => {
              const isHovered = hoveredIndex === index;
              const isCurrent = group.monthKey === currentMonthKey;

              return (
                <g key={group.monthKey}>
                  {/* Highlight Kolom Aktif saat Kursor Lewat */}
                  {isHovered && (
                    <rect
                      x={group.centerX - 24}
                      y={layout.chartTop}
                      width={48}
                      height={layout.chartHeight}
                      fill="var(--surface-hover)"
                      opacity={0.5}
                      rx={8}
                    />
                  )}

                  {/* Bar Penerimaan (Income) - Kiri */}
                  {group.incomeBar.height > 0 && (
                    <rect
                      x={group.incomeBar.x}
                      y={group.incomeBar.y}
                      width={group.incomeBar.width}
                      height={group.incomeBar.height}
                      fill="var(--income)"
                      rx={3}
                      className="transition-opacity duration-150"
                      opacity={hoveredIndex === null || isHovered ? 1 : 0.45}
                    />
                  )}

                  {/* Bar Pengeluaran (Expense) - Kanan */}
                  {group.expenseBar.height > 0 && (
                    <rect
                      x={group.expenseBar.x}
                      y={group.expenseBar.y}
                      width={group.expenseBar.width}
                      height={group.expenseBar.height}
                      fill="var(--expense)"
                      rx={3}
                      className="transition-opacity duration-150"
                      opacity={hoveredIndex === null || isHovered ? 1 : 0.45}
                    />
                  )}

                  {/* Label Bulan di Bawah Sumbu */}
                  <text
                    x={group.centerX}
                    y={layout.baselineY + 18}
                    textAnchor="middle"
                    className={cx(
                      "text-[10px] font-medium tracking-tight",
                      isCurrent
                        ? "fill-primary font-bold"
                        : isHovered
                          ? "fill-foreground font-semibold"
                          : "fill-subtle-foreground",
                    )}
                  >
                    {group.label}
                  </text>

                  {/* Hit Target Luas (>= 48px) untuk Sentuhan Mobile & Hover */}
                  <rect
                    x={group.centerX - 28}
                    y={layout.chartTop}
                    width={56}
                    height={layout.chartHeight + 30}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(index)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Indikator Halus bila Belum Ada Transaksi Tercatat */}
          {!hasAnyData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <div className="rounded-2xl border border-border/80 bg-surface/90 px-4 py-2.5 shadow-xs backdrop-blur-md text-center max-w-sm">
                <p className="text-xs font-semibold text-foreground">
                  Belum ada mutasi tercatat pada rentang 6 bulan ini
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Grafik tren arus kas akan otomatis terisi saat mutasi kas masuk atau keluar dicatat.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Tooltip Melayang yang Mengikuti Kolom */}
          {activeGroup && (
            <div
              className="pointer-events-none absolute z-20 -top-2 flex -translate-x-1/2 flex-col rounded-xl border border-border bg-surface p-2.5 shadow-lifted animate-fade-in text-xs min-w-44 backdrop-blur-md"
              style={{
                left: `${(activeGroup.centerX / layout.viewWidth) * 100}%`,
              }}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="font-semibold text-foreground">
                  {activeGroup.data.label}
                </span>
                <span
                  className={cx(
                    "text-[10px] font-bold font-mono px-1.5 py-0.2 rounded",
                    activeGroup.data.net >= 0
                      ? "bg-income-soft text-income"
                      : "bg-expense-soft text-expense",
                  )}
                >
                  {activeGroup.data.net >= 0 ? "Surplus" : "Defisit"}
                </span>
              </div>

              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-income shrink-0" />
                    <span>Penerimaan:</span>
                  </span>
                  <span className="font-mono font-semibold text-income tabular-nums">
                    +{formatRupiah(activeGroup.data.income)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-expense shrink-0" />
                    <span>Pengeluaran:</span>
                  </span>
                  <span className="font-mono font-semibold text-expense tabular-nums">
                    −{formatRupiah(activeGroup.data.expense)}
                  </span>
                </div>

                <div className="pt-1 mt-1 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-foreground">
                  <span className="text-muted-foreground">Arus Bersih:</span>
                  <span className="font-mono font-bold tabular-nums">
                    {activeGroup.data.net >= 0 ? "+" : "−"}
                    {formatRupiah(Math.abs(activeGroup.data.net))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aksesibilitas Alternatif: Tabulasi Data Terperinci */}
        <details className="mt-4 pt-3 border-t border-border/60">
          <summary className="inline-flex min-h-11 items-center cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition">
            Lihat rincian data tabel
          </summary>
          <div className="mt-2.5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-left text-subtle-foreground font-medium">
                  <th className="px-3.5 py-2.5">Bulan</th>
                  <th className="px-3.5 py-2.5 text-right">Penerimaan</th>
                  <th className="px-3.5 py-2.5 text-right">Pengeluaran</th>
                  <th className="px-3.5 py-2.5 text-right">Surplus / Defisit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-surface-hover">
                    <td className="px-3.5 py-2 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-income tabular-nums">
                      +{formatRupiah(row.income)}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-expense tabular-nums">
                      −{formatRupiah(row.expense)}
                    </td>
                    <td
                      className={cx(
                        "px-3.5 py-2 text-right font-mono font-semibold tabular-nums",
                        row.net >= 0 ? "text-income" : "text-expense",
                      )}
                    >
                      {row.net >= 0 ? "+" : "−"}
                      {formatRupiah(Math.abs(row.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </Card>
  );
}
