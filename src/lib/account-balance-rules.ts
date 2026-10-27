import { formatRupiah } from "./money";

/**
 * Aturan bisnis murni untuk pengecekan saldo akun dan peringatan dana tidak mencukupi.
 *
 * Sesuai aturan AGENTS.md §5, fungsi ini murni (pure function) tanpa akses DB
 * agar bisa diuji secara deterministik di vitest.
 */

export type BalanceCheckInput = {
  /** Jenis akun (TUNAI | BANK | EWALLET | KREDIT). */
  accountType?: string | null;
  /** Saldo kas terkini dari akun. */
  balance: number;
  /** Nominal yang diinput pada form (bisa null/0 saat form baru dibuka). */
  amount: number | null | undefined;
  /** Jenis transaksi (INCOME | EXPENSE). */
  kind?: "INCOME" | "EXPENSE" | string;
};

export type BalanceCheckResult = {
  /** Apakah pengeluaran melebihi saldo kas yang ada. */
  isInsufficient: boolean;
  /** Pesan penjelasan untuk pengguna bila dana tidak mencukupi. */
  message: string | null;
  /** Saldo terformat rupiah untuk ditampilkan di UI. */
  formattedBalance: string;
};

/**
 * Memeriksa kecukupan saldo akun untuk transaksi pemasukan/pengeluaran.
 *
 * Aturan:
 * - Pemasukan (INCOME): selalu aman (dana bertambah, bukan berkurang).
 * - Kartu Kredit (KREDIT): wajar bersaldo negatif / memiliki limit utang,
 *   sehingga tidak ditandai sebagai dana kas defisit.
 * - Tunai / Bank / E-Wallet: jika nominal pengeluaran melebihi saldo kas riil,
 *   berikan peringatan bahwa saldo tidak mencukupi.
 */
export function checkInsufficientBalance(input: BalanceCheckInput): BalanceCheckResult {
  const { accountType, balance, amount, kind = "EXPENSE" } = input;
  const formattedBalance = formatRupiah(balance);

  // Pemasukan tidak pernah mengurangi saldo kas
  if (kind === "INCOME") {
    return {
      isInsufficient: false,
      message: null,
      formattedBalance,
    };
  }

  // Jika belum ada nominal atau nol, belum ada defisit
  if (amount == null || amount <= 0) {
    return {
      isInsufficient: false,
      message: null,
      formattedBalance,
    };
  }

  // Akun KREDIT (kartu kredit/utang) memang dirancang untuk penggunaan limit
  if (accountType === "KREDIT") {
    return {
      isInsufficient: false,
      message: null,
      formattedBalance,
    };
  }

  // Akun kas likuid (Tunai, Bank, E-Wallet) tidak boleh ditarik melebihi saldo
  if (balance < amount) {
    return {
      isInsufficient: true,
      message: `Nominal (${formatRupiah(amount)}) melebihi saldo akun (${formattedBalance}).`,
      formattedBalance,
    };
  }

  return {
    isInsufficient: false,
    message: null,
    formattedBalance,
  };
}

/**
 * Saldo akun tanpa pengaruh transaksi yang sedang diubah.
 *
 * Di mode ubah, saldo dari server sudah memuat transaksi asli. Kalau nominal
 * form dibandingkan langsung ke saldo itu, mengubah transaksi tanpa mengganti
 * apa pun bisa memunculkan peringatan palsu (saldo sudah terpotong oleh
 * transaksi itu sendiri). Pengaruh transaksi asli dikembalikan dulu.
 *
 * Hanya transaksi APPROVED yang memengaruhi saldo (lihat `getAccountBalances`),
 * dan hanya bila akun yang dipilih masih akun aslinya.
 */
export function balanceExcludingTransaction(input: {
  balance: number;
  sameAccount: boolean;
  original?: { kind: string; amount: number; status?: string | null } | null;
}): number {
  const { balance, sameAccount, original } = input;

  if (!sameAccount || !original || original.status !== "APPROVED") {
    return balance;
  }

  const effect = original.kind === "INCOME" ? original.amount : -original.amount;
  return balance - effect;
}

export type TransferBalanceCheckInput = {
  fromAccountType?: string | null;
  fromAccountBalance: number;
  amount: number | null | undefined;
};

export type TransferBalanceCheckResult = {
  isInsufficient: boolean;
  message: string | null;
  formattedBalance: string;
};

/**
 * Memeriksa kecukupan saldo akun asal untuk mutasi transfer antar rekening.
 */
export function checkTransferBalance(
  input: TransferBalanceCheckInput,
): TransferBalanceCheckResult {
  const { fromAccountType, fromAccountBalance, amount } = input;
  const formattedBalance = formatRupiah(fromAccountBalance);

  if (amount == null || amount <= 0) {
    return {
      isInsufficient: false,
      message: null,
      formattedBalance,
    };
  }

  if (fromAccountType === "KREDIT") {
    return {
      isInsufficient: false,
      message: null,
      formattedBalance,
    };
  }

  if (fromAccountBalance < amount) {
    return {
      isInsufficient: true,
      message: `Nominal transfer (${formatRupiah(amount)}) melebihi saldo akun asal (${formattedBalance}).`,
      formattedBalance,
    };
  }

  return {
    isInsufficient: false,
    message: null,
    formattedBalance,
  };
}
