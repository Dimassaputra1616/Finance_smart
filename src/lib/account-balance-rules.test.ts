import { describe, expect, it } from "vitest";
import {
  balanceExcludingTransaction,
  checkInsufficientBalance,
  checkTransferBalance,
} from "./account-balance-rules";

describe("checkInsufficientBalance", () => {
  it("selalu aman untuk transaksi pemasukan (INCOME)", () => {
    const res = checkInsufficientBalance({
      accountType: "TUNAI",
      balance: 100_000,
      amount: 500_000,
      kind: "INCOME",
    });
    expect(res.isInsufficient).toBe(false);
    expect(res.message).toBeNull();
    expect(res.formattedBalance).toContain("100.000");
  });

  it("aman jika pengeluaran lebih kecil atau sama dengan saldo", () => {
    const within = checkInsufficientBalance({
      accountType: "BANK",
      balance: 1_000_000,
      amount: 750_000,
      kind: "EXPENSE",
    });
    expect(within.isInsufficient).toBe(false);
    expect(within.message).toBeNull();

    const exact = checkInsufficientBalance({
      accountType: "BANK",
      balance: 1_000_000,
      amount: 1_000_000,
      kind: "EXPENSE",
    });
    expect(exact.isInsufficient).toBe(false);
  });

  it("mendeteksi jika pengeluaran melebihi saldo kas", () => {
    const res = checkInsufficientBalance({
      accountType: "TUNAI",
      balance: 200_000,
      amount: 350_000,
      kind: "EXPENSE",
    });
    expect(res.isInsufficient).toBe(true);
    expect(res.message).toContain("350.000");
    expect(res.message).toContain("200.000");
  });

  it("tidak menandai defisit untuk akun kartu kredit (KREDIT)", () => {
    const res = checkInsufficientBalance({
      accountType: "KREDIT",
      balance: 0,
      amount: 2_500_000,
      kind: "EXPENSE",
    });
    expect(res.isInsufficient).toBe(false);
    expect(res.message).toBeNull();
  });

  it("aman saat form baru dibuka (nominal nol atau belum diisi)", () => {
    expect(
      checkInsufficientBalance({
        accountType: "BANK",
        balance: 500_000,
        amount: null,
      }).isInsufficient,
    ).toBe(false);

    expect(
      checkInsufficientBalance({
        accountType: "BANK",
        balance: 500_000,
        amount: 0,
      }).isInsufficient,
    ).toBe(false);
  });
});

describe("balanceExcludingTransaction", () => {
  it("mengembalikan pengeluaran asli yang sudah memotong saldo", () => {
    // Saldo sekarang 10.000 setelah pengeluaran 80.000; tanpa itu 90.000.
    expect(
      balanceExcludingTransaction({
        balance: 10_000,
        sameAccount: true,
        original: { kind: "EXPENSE", amount: 80_000, status: "APPROVED" },
      }),
    ).toBe(90_000);
  });

  it("mengurangi pemasukan asli yang sudah menambah saldo", () => {
    expect(
      balanceExcludingTransaction({
        balance: 100_000,
        sameAccount: true,
        original: { kind: "INCOME", amount: 30_000, status: "APPROVED" },
      }),
    ).toBe(70_000);
  });

  it("tidak mengubah saldo untuk transaksi PENDING atau REJECTED", () => {
    for (const status of ["PENDING", "REJECTED"]) {
      expect(
        balanceExcludingTransaction({
          balance: 10_000,
          sameAccount: true,
          original: { kind: "EXPENSE", amount: 80_000, status },
        }),
      ).toBe(10_000);
    }
  });

  it("tidak mengubah saldo bila akun dipindah ke akun lain", () => {
    expect(
      balanceExcludingTransaction({
        balance: 10_000,
        sameAccount: false,
        original: { kind: "EXPENSE", amount: 80_000, status: "APPROVED" },
      }),
    ).toBe(10_000);
  });

  it("tidak mengubah saldo pada mode tambah (tanpa transaksi asli)", () => {
    expect(
      balanceExcludingTransaction({ balance: 10_000, sameAccount: false, original: null }),
    ).toBe(10_000);
  });
});

describe("checkTransferBalance", () => {
  it("aman jika nominal transfer tidak melebihi saldo akun asal", () => {
    const res = checkTransferBalance({
      fromAccountType: "BANK",
      fromAccountBalance: 2_000_000,
      amount: 1_500_000,
    });
    expect(res.isInsufficient).toBe(false);
    expect(res.message).toBeNull();
  });

  it("mendeteksi jika transfer melebihi saldo akun asal", () => {
    const res = checkTransferBalance({
      fromAccountType: "EWALLET",
      fromAccountBalance: 50_000,
      amount: 100_000,
    });
    expect(res.isInsufficient).toBe(true);
    expect(res.message).toContain("100.000");
    expect(res.message).toContain("50.000");
  });

  it("mengizinkan transfer dari akun KREDIT tanpa peringatan saldo", () => {
    const res = checkTransferBalance({
      fromAccountType: "KREDIT",
      fromAccountBalance: 0,
      amount: 1_000_000,
    });
    expect(res.isInsufficient).toBe(false);
  });
});
