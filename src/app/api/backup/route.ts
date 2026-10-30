import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canAccessConfigMaster } from "@/lib/transaction-rules";
import { db } from "@/lib/db";
import { getBrandConfig } from "@/server/brand-storage";

export const dynamic = "force-dynamic";

/**
 * Endpoint Pengunduhan Cadangan Database (JSON Export) 1-Klik.
 * Khusus untuk Super Admin (ADMIN).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canAccessConfigMaster(user.role)) {
    return new NextResponse("Akses ditolak: Hanya Super Admin yang berhak mengunduh cadangan database.", { status: 403 });
  }

  try {
    const [accounts, categories, transactions, receivables, brandConfig] = await Promise.all([
      db.account.findMany({ orderBy: { createdAt: "asc" } }),
      db.category.findMany({ orderBy: { createdAt: "asc" } }),
      db.transaction.findMany({
        orderBy: { occurredAt: "desc" },
        include: {
          account: { select: { name: true } },
          category: { select: { name: true, kind: true } },
        },
      }),
      db.receivable.findMany({
        orderBy: { lentAt: "desc" },
        include: { payments: true },
      }),
      getBrandConfig(),
    ]);

    const backupData = {
      app: brandConfig.appName,
      exportedAt: new Date().toISOString(),
      exportedBy: user.name,
      version: "2.0",
      summary: {
        totalAccounts: accounts.length,
        totalCategories: categories.length,
        totalTransactions: transactions.length,
        totalReceivables: receivables.length,
      },
      config: brandConfig,
      data: {
        accounts,
        categories,
        transactions,
        receivables,
      },
    };

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `backup-keuangan-${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new NextResponse("Gagal membuat cadangan data: " + String(err), { status: 500 });
  }
}
