import Link from "next/link";
import { createTransaction } from "@/server/actions/transactions";
import { getAccountBalances, getActiveCategories } from "@/server/queries/finance";
import { getCurrentUser } from "@/lib/session";
import { canManageMasterData } from "@/lib/transaction-rules";
import type { TransactionKind } from "@/lib/types";
import { IconArrowLeft } from "@/components/Icons";
import {
  TransactionForm,
  type AccountOption,
  type CategoryOption,
} from "@/components/transactions/TransactionForm";
import { Card, EmptyState, buttonStyles } from "@/components/ui";

export const metadata = { title: "Catat Transaksi" };

// Daftar akun dan kategori diambil dari database saat request.
export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const [accounts, categories, currentUser] = await Promise.all([
    getAccountBalances(),
    getActiveCategories(),
    getCurrentUser(),
  ]);

  const canManage = canManageMasterData(currentUser?.role);

  const accountOptions: AccountOption[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    balance: account.balance,
    type: account.type,
  }));

  const categoryOptions: CategoryOption[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    kind: category.kind as TransactionKind,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <header className="space-y-3">
        <Link
          href="/transaksi"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <IconArrowLeft className="h-4 w-4" />
          Kembali ke daftar
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">
            Entri baru
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Catat transaksi
          </h1>
        </div>
      </header>

      <Card className="p-5 sm:p-6">
        {accounts.length === 0 || categories.length === 0 ? (
          <EmptyState
            title="Data pendukung belum lengkap"
            description={
              canManage
                ? accounts.length === 0
                  ? "Minimal satu akun diperlukan sebelum mencatat transaksi."
                  : "Minimal satu kategori diperlukan sebelum mencatat transaksi."
                : "Akun rekening atau pos anggaran belum disiapkan oleh Administrator. Hubungi Administrator untuk menambahkannya sebelum mencatat transaksi."
            }
            action={
              canManage ? (
                <div className="flex gap-2">
                  {accounts.length === 0 ? (
                    <Link href="/akun" className={buttonStyles("secondary", "sm")}>
                      Tambah akun
                    </Link>
                  ) : null}
                  {categories.length === 0 ? (
                    <Link
                      href="/kategori"
                      className={buttonStyles("secondary", "sm")}
                    >
                      Tambah kategori
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link href="/transaksi" className={buttonStyles("secondary", "sm")}>
                  Lihat jurnal kas
                </Link>
              )
            }
          />
        ) : (
          <TransactionForm
            action={createTransaction}
            accounts={accountOptions}
            categories={categoryOptions}
            submitLabel="Simpan transaksi"
          />
        )}
      </Card>
    </div>
  );
}