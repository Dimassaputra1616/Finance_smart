import { describe, expect, it } from "vitest";
import {
  CASH_REPORT_HEADERS,
  buildCsvDocument,
  escapeCsvCell,
  formatTransactionsToCsvRows,
  type ExportTransactionItem,
} from "./csv";

describe("escapeCsvCell — RFC 4180 & Keamanan", () => {
  it("menangani nilai kosong, null, dan undefined", () => {
    expect(escapeCsvCell("")).toBe("");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("membiarkan teks biasa tanpa kutip", () => {
    expect(escapeCsvCell("Beli Kertas HVS")).toBe("Beli Kertas HVS");
    expect(escapeCsvCell(125000)).toBe("125000");
  });

  it("membungkus teks yang memuat koma dengan kutip ganda", () => {
    expect(escapeCsvCell("Kopi, Teh, dan Gula")).toBe('"Kopi, Teh, dan Gula"');
  });

  it("menggandakan tanda kutip ganda di dalam teks (RFC 4180)", () => {
    expect(escapeCsvCell('Nota "Resmi" Kantor')).toBe('"Nota ""Resmi"" Kantor"');
  });

  it("menangani teks berbaris baru (multiline)", () => {
    expect(escapeCsvCell("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
    expect(escapeCsvCell("Baris 1\r\nBaris 2")).toBe('"Baris 1\r\nBaris 2"');
  });

  it("mencegah CSV Formula Injection (DDE) pada teks yang diawali '=', '+', '-', '@'", () => {
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCsvCell("@cmd|'/C calc'!A0")).toBe("'@cmd|'/C calc'!A0");
    expect(escapeCsvCell("+12345_injeksi")).toBe("'+12345_injeksi");
  });

  it("tidak merusak angka bertanda minus normal", () => {
    expect(escapeCsvCell("-150000")).toBe("-150000");
    expect(escapeCsvCell("+50000")).toBe("+50000");
  });
});

describe("buildCsvDocument", () => {
  it("menghasilkan dokumen CSV berawalan BOM UTF-8 (\\uFEFF) dengan CRLF", () => {
    const headers = ["No", "Keterangan", "Nominal"];
    const rows = [
      [1, "Makan Siang", 45000],
      [2, "Parkir, Tips", 5000],
    ];

    const csv = buildCsvDocument(headers, rows);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("No,Keterangan,Nominal\r\n");
    expect(csv).toContain('1,Makan Siang,45000\r\n2,"Parkir, Tips",5000\r\n');
  });
});

describe("formatTransactionsToCsvRows", () => {
  const sample: ExportTransactionItem[] = [
    {
      id: "tx-1",
      occurredAt: new Date("2026-10-15T00:00:00.000Z"),
      kind: "INCOME",
      amount: 50_000_000,
      description: "Termin Proyek Alpha",
      notes: "Transfer Mandiri",
      status: "APPROVED",
      account: { name: "Bank Mandiri" },
      category: { name: "Penerimaan Termin" },
      createdBy: { name: "Dimas Saputra" },
      approvedBy: { name: "Dimas Saputra" },
      approvedAt: new Date("2026-10-15T08:00:00.000Z"),
      proofPath: "/api/proofs/nota_1.webp",
    },
    {
      id: "tx-2",
      occurredAt: "2026-10-16",
      kind: "EXPENSE",
      amount: 150_000,
      description: "Konsumsi Rapat",
      notes: null,
      status: "PENDING",
      account: { name: "Dompet Tunai" },
      category: { name: "Makan & Minum" },
      createdBy: { name: "Staf Operasional" },
      approvedBy: null,
      approvedAt: null,
      proofPath: null,
    },
  ];

  it("memetakan data transaksi ke baris CSV laporan kas dengan benar", () => {
    const rows = formatTransactionsToCsvRows(sample);

    expect(rows).toHaveLength(2);
    expect(CASH_REPORT_HEADERS).toHaveLength(14);

    // Baris 1: Income
    const r1 = rows[0];
    expect(r1[0]).toBe(1); // No
    expect(r1[1]).toBe("2026-10-15"); // Tanggal
    expect(r1[2]).toBe("Penerimaan Kas"); // Jenis
    expect(r1[3]).toBe("Termin Proyek Alpha"); // Keterangan
    expect(r1[4]).toBe("Penerimaan Termin"); // Pos Anggaran
    expect(r1[5]).toBe("Bank Mandiri"); // Rekening
    expect(r1[6]).toBe(50_000_000); // Penerimaan IDR
    expect(r1[7]).toBe(0); // Pengeluaran IDR
    expect(r1[8]).toBe("Disetujui"); // Status
    expect(r1[9]).toBe("Transfer Mandiri"); // Catatan
    expect(r1[10]).toBe("Dimas Saputra"); // Dicatat Oleh
    expect(r1[11]).toBe("Dimas Saputra"); // Disetujui Oleh
    expect(r1[12]).toBe("2026-10-15"); // Tanggal Disetujui
    expect(r1[13]).toBe("Ada"); // Bukti Nota

    // Baris 2: Expense
    const r2 = rows[1];
    expect(r2[0]).toBe(2);
    expect(r2[1]).toBe("2026-10-16");
    expect(r2[2]).toBe("Pengeluaran Kas");
    expect(r2[6]).toBe(0); // Penerimaan IDR
    expect(r2[7]).toBe(150_000); // Pengeluaran IDR
    expect(r2[8]).toBe("Menunggu Persetujuan");
    expect(r2[10]).toBe("Staf Operasional");
    expect(r2[11]).toBe("-");
    expect(r2[12]).toBe("");
    expect(r2[13]).toBe("Tidak Ada");
  });
});
