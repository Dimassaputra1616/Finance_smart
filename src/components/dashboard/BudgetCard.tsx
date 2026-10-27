import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import type { BudgetRow, BudgetStatus } from "@/lib/budget-rules";
import {
  Card,
  CardHeader,
  EmptyState,
  buttonStyles,
  cx,
} from "@/components/ui";

// Status selalu punya label teks, bukan hanya warna, supaya tetap terbaca oleh
// pengguna buta warna dan pembaca layar.
const STATUS_STYLES: Record<
  BudgetStatus,
  { label: string; bar: string; chip: string }
> = {
  safe: { label: "Aman", bar: "bg-income", chip: "bg-income-soft text-income" },
  warning: {
    label: "Mendekati batas",
    bar: "bg-warning",
    chip: "bg-warning-soft text-warning",
  },
  over: {
    label: "Melebihi pagu",
    bar: "bg-destructive",
    chip: "bg-destructive-soft text-destructive",
  },
};

/** Realisasi pengeluaran per pos terhadap pagu bulanan. */
export function BudgetCard({
  rows,
  canManage = false,
}: {
  rows: BudgetRow[];
  canManage?: boolean;
}) {
  const overCount = rows.filter((row) => row.status === "over").length;

  const description =
    rows.length === 0
      ? "Batas pengeluaran bulanan per pos anggaran."
      : overCount > 0
        ? `${overCount} dari ${rows.length} pos melewati pagu`
        : `${rows.length} pos dipantau`;

  return (
    <Card>
      <CardHeader
        title="Realisasi terhadap Pagu Bulanan"
        description={description}
        action={
          canManage ? (
            <Link href="/kategori" className={buttonStyles("ghost", "sm")}>
              Atur pagu
            </Link>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          compact
          title="Belum ada pagu bulanan"
          description={
            canManage
              ? "Tetapkan batas per pos anggaran untuk memantau pengeluaran."
              : "Batas pengeluaran per pos anggaran belum diatur oleh Administrator."
          }
        />
      ) : (
        <ul className="space-y-5 p-5">
          {rows.map((row) => {
            const style = STATUS_STYLES[row.status];

            return (
              <li key={row.categoryId} className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span
                    className={cx(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      style.chip,
                    )}
                  >
                    {style.label}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={`Realisasi ${row.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(row.barPercent)}
                  aria-valuetext={`${row.percent}% dari pagu`}
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted"
                >
                  <div
                    className={cx(
                      "animate-grow h-full origin-left rounded-full",
                      style.bar,
                    )}
                    style={{ width: `${row.barPercent}%` }}
                  />
                </div>

                {/* `rp-amount` menjaga nominal tidak terbelah di tengah digit;
                    baris boleh membungkus antar-kelompok kalau sempit. */}
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    <span className="rp-amount font-semibold tabular-nums text-foreground">
                      {formatRupiah(row.spent)}
                    </span>{" "}
                    dari{" "}
                    <span className="rp-amount tabular-nums">
                      {formatRupiah(row.budget)}
                    </span>{" "}
                    ({row.percent}%)
                  </span>
                  <span className="rp-amount tabular-nums">
                    {row.status === "over"
                      ? `Lebih ${formatRupiah(row.overBy)}`
                      : `Sisa ${formatRupiah(row.remaining)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
