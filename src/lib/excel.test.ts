import { describe, expect, it } from "vitest";
import { buildExcelReport, escapeHtml } from "./excel";
import type { ExportTransactionItem } from "./csv";

describe("escapeHtml", () => {
  it("meng-escape karakter khusus HTML dengan aman", () => {
    expect(escapeHtml("Peralatan <A> & 'B' \"C\"")).toBe(
      "Peralatan &lt;A&gt; &amp; &#39;B&#39; &quot;C&quot;",
    );
  });

  it("menangani nilai kosong, null, dan undefined", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("buildExcelReport", () => {
  const sample: ExportTransactionItem[] = [
    {
      id: "tx-1",
      occurredAt: "2026-10-01",
      kind: "INCOME",
      amount: 10_000_000,
      description: "Pendapatan Jasa",
      notes: "Klien PT Maju",
      status: "APPROVED",
      account: { name: "Bank Mandiri" },
      category: { name: "Penjualan" },
      createdBy: { name: "Admin" },
      approvedBy: { name: "Admin" },
      approvedAt: "2026-10-01",
      proofPath: "/api/proofs/proof_1.webp",
    },
    {
      id: "tx-2",
      occurredAt: "2026-10-02",
      kind: "EXPENSE",
      amount: 2_500_000,
      description: "Beli Alat Tulis & Meja",
      notes: null,
      status: "PENDING",
      account: { name: "Kas Kecil" },
      category: { name: "Operasional" },
      createdBy: { name: "Staf" },
      approvedBy: null,
      approvedAt: null,
      proofPath: null,
    },
  ];

  it("menghasilkan struktur spreadsheet HTML Excel ber-gridline dan ber-tabel", () => {
    const html = buildExcelReport({
      periodLabel: "Oktober 2026",
      items: sample,
    });

    // Validasi XML Excel workbook & gridlines
    expect(html).toContain("<x:ExcelWorkbook>");
    expect(html).toContain("<x:DisplayGridlines />");
    expect(html).toContain("LAPORAN PERBENDAHARAAN &amp; KAS KANTOR");
    expect(html).toContain("Periode:");
    expect(html).toContain("Oktober 2026");

    // Header tabel
    expect(html).toContain("Keterangan Mutasi");
    expect(html).toContain("Pos Anggaran");
    expect(html).toContain("Penerimaan (IDR)");
    expect(html).toContain("Pengeluaran (IDR)");

    // Baris data dengan escape
    expect(html).toContain("Beli Alat Tulis &amp; Meja");
    expect(html).toContain("Bank Mandiri");
    expect(html).toContain("10000000");
    expect(html).toContain("2500000");
    expect(html).toContain("Ada Bukti");

    // Footer total dan surplus
    expect(html).toContain("TOTAL KESELURUHAN:");
    expect(html).toContain("Surplus Kas:");
  });

  it("menghitung defisit dengan benar bila pengeluaran lebih besar dari pemasukan", () => {
    const expenseOnly: ExportTransactionItem[] = [
      {
        id: "tx-3",
        occurredAt: "2026-10-05",
        kind: "EXPENSE",
        amount: 500_000,
        description: "Beban Listrik",
        status: "APPROVED",
        account: { name: "Kas" },
        category: { name: "Utilitas" },
      },
    ];

    const html = buildExcelReport({
      periodLabel: "Oktober 2026",
      items: expenseOnly,
    });

    expect(html).toContain("Defisit Kas:");
  });

  it("bekerja mulus saat daftar transaksi kosong", () => {
    const html = buildExcelReport({
      periodLabel: "November 2026",
      items: [],
    });

    expect(html).toContain("TOTAL KESELURUHAN:");
    expect(html).toContain("Periode:");
    expect(html).toContain("November 2026");
  });
});
