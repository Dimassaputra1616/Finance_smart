import { formatRupiah } from "./money";
import type { ExportTransactionItem } from "./csv";

/**
 * Generator spreadsheet Excel (.xls) berformat resmi tanpa dependensi eksternal.
 *
 * Menggunakan format HTML SpreadsheetML yang didukung penuh secara bawaan oleh
 * Microsoft Excel (Windows & Mac), Google Sheets, dan LibreOffice Calc:
 * - Dilengkapi gridlines aktif (<x:DisplayGridlines/>).
 * - Header tabel korporat berlatar hijau pinus (#142d22) dengan teks emas (#e8c77b).
 * - Format angka rupiah rapi rata kanan dengan pemisah ribuan otomatis.
 * - Baris zebra belang lembut (#ffffff & #f9fafb) dengan garis pembatas sel.
 * - Baris total rekapitulasi di bagian bawah (Penerimaan, Pengeluaran, Surplus/Defisit).
 * - Semua sel di-escape secara aman terhadap karakter HTML (<, >, &, ").
 */

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type BuildExcelReportOptions = {
  title?: string;
  periodLabel: string;
  generatedAt?: string;
  items: ExportTransactionItem[];
};

export function buildExcelReport(options: BuildExcelReportOptions): string {
  const {
    title = "LAPORAN PERBENDAHARAAN & KAS KANTOR",
    periodLabel,
    generatedAt = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "long",
      timeStyle: "short",
    }) + " WIB",
    items,
  } = options;

  let totalIncome = 0;
  let totalExpense = 0;

  for (const item of items) {
    if (item.kind === "INCOME") {
      totalIncome += item.amount;
    } else {
      totalExpense += item.amount;
    }
  }

  const netCashflow = totalIncome - totalExpense;

  const tableRows = items.map((item, index) => {
    const isIncome = item.kind === "INCOME";
    const dateStr =
      item.occurredAt instanceof Date
        ? item.occurredAt.toISOString().slice(0, 10)
        : String(item.occurredAt).slice(0, 10);

    const approvedDateStr = item.approvedAt
      ? item.approvedAt instanceof Date
        ? item.approvedAt.toISOString().slice(0, 10)
        : String(item.approvedAt).slice(0, 10)
      : "-";

    const statusBadge =
      item.status === "APPROVED"
        ? '<span style="color:#0f5132;font-weight:600;">Disetujui</span>'
        : item.status === "PENDING"
          ? '<span style="color:#856404;font-weight:600;">Menunggu</span>'
          : '<span style="color:#842029;font-weight:600;">Ditolak</span>';

    const incomeVal = isIncome ? item.amount : 0;
    const expenseVal = !isIncome ? item.amount : 0;

    const bg = index % 2 === 1 ? ' style="background-color:#f9fafb;"' : "";

    return `
      <tr${bg}>
        <td style="text-align:center;border:1px solid #d1d5db;padding:6px;">${index + 1}</td>
        <td style="text-align:center;border:1px solid #d1d5db;padding:6px;mso-number-format:'\\@';">${escapeHtml(dateStr)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;font-weight:500;">${escapeHtml(item.description)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(item.category.name)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(item.account.name)}</td>
        <td style="text-align:right;border:1px solid #d1d5db;padding:6px;mso-number-format:'\\#\\,\\#\\#0';color:#0f5132;">${incomeVal}</td>
        <td style="text-align:right;border:1px solid #d1d5db;padding:6px;mso-number-format:'\\#\\,\\#\\#0';color:#842029;">${expenseVal}</td>
        <td style="text-align:center;border:1px solid #d1d5db;padding:6px;">${statusBadge}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(item.notes ?? "-")}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(item.createdBy?.name ?? "-")}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(item.approvedBy?.name ?? "-")}</td>
        <td style="text-align:center;border:1px solid #d1d5db;padding:6px;mso-number-format:'\\@';">${escapeHtml(approvedDateStr)}</td>
        <td style="text-align:center;border:1px solid #d1d5db;padding:6px;">${item.proofPath ? "Ada Bukti" : "-"}</td>
      </tr>`;
  });

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Laporan Kas</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines />
            <x:FitToPage />
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #142d22; color: #f7f5ed; font-weight: bold; border: 1px solid #0d1f17; padding: 8px 6px; text-align: center; }
    .num { mso-number-format: '#,##0'; text-align: right; }
    .txt { mso-number-format: '\\@'; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="13" style="font-size:16pt;font-weight:bold;color:#142d22;padding:8px 0;">
        ${escapeHtml(title)}
      </td>
    </tr>
    <tr>
      <td colspan="13" style="font-size:11pt;color:#4b5563;padding-bottom:12px;">
        Periode: <strong>${escapeHtml(periodLabel)}</strong> &nbsp;|&nbsp; Dicetak pada: ${escapeHtml(generatedAt)}
      </td>
    </tr>
    <thead>
      <tr>
        <th style="width:40px;">No</th>
        <th style="width:90px;">Tanggal</th>
        <th style="width:240px;">Keterangan Mutasi</th>
        <th style="width:140px;">Pos Anggaran</th>
        <th style="width:130px;">Rekening / Kas</th>
        <th style="width:130px;">Penerimaan (IDR)</th>
        <th style="width:130px;">Pengeluaran (IDR)</th>
        <th style="width:100px;">Status</th>
        <th style="width:180px;">Catatan</th>
        <th style="width:120px;">Dicatat Oleh</th>
        <th style="width:120px;">Disetujui Oleh</th>
        <th style="width:90px;">Tgl Disetujui</th>
        <th style="width:80px;">Bukti Nota</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows.join("")}
    </tbody>
    <tfoot>
      <tr style="background-color:#e5e7eb;font-weight:bold;">
        <td colspan="5" style="border:1px solid #9ca3af;padding:8px;text-align:right;">TOTAL KESELURUHAN:</td>
        <td style="border:1px solid #9ca3af;padding:8px;text-align:right;mso-number-format:'\\#\\,\\#\\#0';color:#0f5132;">${totalIncome}</td>
        <td style="border:1px solid #9ca3af;padding:8px;text-align:right;mso-number-format:'\\#\\,\\#\\#0';color:#842029;">${totalExpense}</td>
        <td colspan="6" style="border:1px solid #9ca3af;padding:8px;font-size:10pt;">
          ${netCashflow >= 0 ? "Surplus Kas: +" : "Defisit Kas: -"}${formatRupiah(Math.abs(netCashflow))}
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
