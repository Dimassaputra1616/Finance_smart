import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { formatMonthLabel, normalizeMonthKey } from "@/lib/date";
import {
  isTransactionKind,
  isTransactionStatus,
  type TransactionKind,
} from "@/lib/types";
import { getTransactionsForExport } from "@/server/queries/finance";
import {
  CASH_REPORT_HEADERS,
  buildCsvDocument,
  formatTransactionsToCsvRows,
} from "@/lib/csv";
import { buildExcelReport } from "@/lib/excel";

/**
 * Route handler pengunduhan laporan mutasi kas resmi.
 *
 * Mendukung 2 format:
 * 1. Excel (.xls, default): Format tabel spreadsheet bergaris, berwarna,
 *    berpenjumlahan total, dan rapi dibuka langsung di Microsoft Excel.
 * 2. CSV (.csv): Data mentah ber-BOM UTF-8 untuk integrasi sistem/database.
 *
 * Keamanan:
 * - Wajib login (sesi valid). Anonim ditolak dengan status 401.
 * - Header attachment dengan nama berkas sesuai filter periode bulan.
 * - Dilengkapi pencegahan CSV formula injection dan HTML escaping.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Tidak diizinkan.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format")?.toLowerCase() === "csv" ? "csv" : "excel";

  const monthKey = normalizeMonthKey(searchParams.get("bulan") ?? undefined);
  const kindParam = searchParams.get("jenis");
  const kind = isTransactionKind(kindParam)
    ? (kindParam as TransactionKind)
    : undefined;
  const statusParam = searchParams.get("status");
  const status = isTransactionStatus(statusParam) ? statusParam : undefined;

  const categoryId = searchParams.get("kategori") || undefined;
  const accountId = searchParams.get("akun") || undefined;
  const keyword = searchParams.get("q") || undefined;

  const items = await getTransactionsForExport({
    monthKey,
    kind,
    status,
    categoryId,
    accountId,
    keyword,
  });

  const periodLabel = formatMonthLabel(monthKey);

  if (format === "csv") {
    const rows = formatTransactionsToCsvRows(items);
    const csvContent = buildCsvDocument(CASH_REPORT_HEADERS, rows);
    const filename = `laporan-kas-${monthKey}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  }

  // Format Excel (.xls) ber-gridline dan ber-tabel rapi
  const excelContent = buildExcelReport({
    periodLabel,
    items,
  });
  const filename = `laporan-kas-${monthKey}.xls`;

  return new NextResponse(excelContent, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

