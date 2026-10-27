import type { TransactionStatus } from "./types";

/**
 * Utilitas ekspor CSV yang aman dan kompatibel dengan Microsoft Excel,
 * Google Sheets, dan LibreOffice Calc.
 *
 * Mengikuti RFC 4180:
 * - Menangani tanda kutip ganda, koma, dan karakter baris baru.
 * - Dilengkapi pencegahan CSV Formula Injection (DDE injection): sel teks yang
 *   diawali tanda `=`, `+`, `-`, atau `@` dinetralkan agar tidak dieksekusi sebagai
 *   formula saat dibuka di spreadsheet.
 * - Menggunakan awalan UTF-8 Byte Order Mark (BOM `﻿`) agar Excel membuka
 *   file dengan encoding UTF-8 secara otomatis tanpa teks rusak.
 */

/**
 * Escape satu nilai sel CSV sesuai RFC 4180 dan netralkan potensi formula injection.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Pencegahan CSV Injection: jika diawali karakter eksekusi formula,
  // sisipkan tanda petik tunggal di depan jika bukan angka murni.
  if (/^[=+\-@]/.test(str)) {
    // Jika string bukan angka signed biasa (misal "-125000"), cegah injeksi formula
    const isSignedNumber = /^[+\-]\d+(\.\d+)?$/.test(str.trim());
    if (!isSignedNumber) {
      str = `'${str}`;
    }
  }

  // Jika mengandung koma, kutip ganda, atau baris baru, bungkus dengan kutip
  // dan gandakan kutip di dalamnya (" -> "")
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Susun baris-baris data menjadi string dokumen CSV ber-BOM UTF-8.
 */
export function buildCsvDocument(
  headers: string[],
  rows: Array<Array<unknown>>,
): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));

  // Awalan BOM ﻿ penting untuk kompatibilitas Windows Excel UTF-8
  return `﻿${[headerLine, ...dataLines].join("\r\n")}\r\n`;
}

export type ExportTransactionItem = {
  id: string;
  occurredAt: Date | string;
  kind: "INCOME" | "EXPENSE" | string;
  amount: number;
  description: string;
  notes?: string | null;
  status?: TransactionStatus | string | null;
  account: { name: string };
  category: { name: string };
  createdBy?: { name: string } | null;
  approvedBy?: { name: string } | null;
  approvedAt?: Date | string | null;
  proofPath?: string | null;
};

export const CASH_REPORT_HEADERS = [
  "No",
  "Tanggal",
  "Jenis",
  "Keterangan",
  "Pos Anggaran",
  "Rekening",
  "Penerimaan (IDR)",
  "Pengeluaran (IDR)",
  "Status",
  "Catatan",
  "Dicatat Oleh",
  "Disetujui Oleh",
  "Tanggal Disetujui",
  "Bukti Nota",
];

/**
 * Ubah daftar transaksi menjadi baris-baris data CSV laporan kas operasional.
 */
export function formatTransactionsToCsvRows(
  items: ExportTransactionItem[],
): Array<Array<unknown>> {
  return items.map((item, index) => {
    const isIncome = item.kind === "INCOME";
    const dateStr =
      item.occurredAt instanceof Date
        ? item.occurredAt.toISOString().slice(0, 10)
        : String(item.occurredAt).slice(0, 10);

    const approvedDateStr = item.approvedAt
      ? item.approvedAt instanceof Date
        ? item.approvedAt.toISOString().slice(0, 10)
        : String(item.approvedAt).slice(0, 10)
      : "";

    const statusLabel =
      item.status === "APPROVED"
        ? "Disetujui"
        : item.status === "PENDING"
          ? "Menunggu Persetujuan"
          : item.status === "REJECTED"
            ? "Ditolak"
            : "Disetujui";

    return [
      index + 1,
      dateStr,
      isIncome ? "Penerimaan Kas" : "Pengeluaran Kas",
      item.description,
      item.category.name,
      item.account.name,
      isIncome ? item.amount : 0,
      !isIncome ? item.amount : 0,
      statusLabel,
      item.notes ?? "",
      item.createdBy?.name ?? "-",
      item.approvedBy?.name ?? "-",
      approvedDateStr,
      item.proofPath ? "Ada" : "Tidak Ada",
    ];
  });
}
