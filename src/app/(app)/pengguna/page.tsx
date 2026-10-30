import { getUsersList } from "@/server/queries/users";
import { getCurrentUser, isSuperAdminSession } from "@/lib/session";
import { IconReceipt, IconShield, IconUser, IconUsers } from "@/components/Icons";
import { AccessDenied } from "@/components/layout/AccessDenied";
import { Card } from "@/components/ui";
import { UserForm } from "@/components/users/UserForm";
import { UserListView } from "@/components/users/UserListView";

export const metadata = { title: "Kelola Pengguna" };

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  if (!(await isSuperAdminSession())) return <AccessDenied />;

  const [users, currentUser] = await Promise.all([
    getUsersList(),
    getCurrentUser(),
  ]);

  const adminCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length;
  const directorCount = users.filter((u) => u.role === "DIRECTOR" && u.isActive).length;
  const staffCount = users.filter((u) => u.role === "STAFF" && u.isActive).length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Halaman Modern */}
      <header className="border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-income animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Akses &amp; Otorisasi RBAC
          </p>
        </div>
        <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Kelola Pengguna
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
          Atur hak akses staf operasional, direktur keuangan (approver), dan super administrator sistem.
        </p>
      </header>

      {/* Ringkasan Metrik Pengguna (Modern Bento Stat Cards) */}
      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-4">
        {/* Total Pengguna */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Akun</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconUsers className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {users.length}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle-foreground">Akun terdaftar</p>
        </div>

        {/* Super Admin */}
        <div className="relative overflow-hidden rounded-2xl border border-income/30 bg-income-soft/20 p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-income">Super Admin</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-income-soft text-income">
              <IconShield className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-income font-mono">
            {adminCount}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Akses penuh sistem</p>
        </div>

        {/* Direktur */}
        <div className="relative overflow-hidden rounded-2xl border border-sidebar-brand-from/30 bg-sidebar-brand-from/5 p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sidebar-brand-from">Direktur</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sidebar-brand-from/15 text-sidebar-brand-from">
              <IconReceipt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-sidebar-brand-from font-mono">
            {directorCount}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Approval kas kantor</p>
        </div>

        {/* Staf Operasional */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Staf Kas</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface-muted text-foreground">
              <IconUser className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {staffCount}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle-foreground">Pencatat mutasi nota</p>
        </div>
      </div>

      {/* Konten Utama: Daftar Akun Berfilter (Kiri) & Formulir Tambah Modern (Kanan) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] items-start">
        {/* Kolom Kiri: Tabel Pengguna dengan Pencarian & Filter Peran */}
        <div>
          <UserListView users={users} currentUser={currentUser} />
        </div>

        {/* Kolom Kanan: Formulir Tambah Pengguna */}
        <div>
          <Card padded className="sticky top-6 shadow-xs border-border/80">
            <div className="mb-4 space-y-1 pb-3 border-b border-border/60">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                <span>Registrasi Akun</span>
              </div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Tambah Pengguna Baru
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tetapkan peran otorisasi untuk staf, direktur, atau administrator.
              </p>
            </div>

            <UserForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
