import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasStoredAccount } from "@/server/queries/users";
import { canAccessConfigMaster } from "@/lib/transaction-rules";
import { USER_ROLE_LABELS } from "@/lib/types";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { AvatarUploadSection } from "@/components/profile/AvatarUploadSection";
import { DeviceNotificationCard } from "@/components/notifications/DeviceNotificationCard";
import { InstallPwaCard } from "@/components/pwa/InstallPwaCard";
import { Alert, buttonStyles, Card, CardHeader } from "@/components/ui";
import { IconSparkle } from "@/components/Icons";

export const metadata = { title: "Profil" };

// Membaca sesi dan database pada setiap permintaan.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stored = await hasStoredAccount(user.id);
  const canManageBrand = canAccessConfigMaster(user.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">
          Akun saya
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Profil &amp; keamanan
        </h1>
      </header>

      {/* Akses Cepat Config Master untuk Super Admin */}
      {canManageBrand && (
        <Card padded className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sidebar-brand-from/15 text-sidebar-brand-foreground">
              <IconSparkle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Config Master &amp; Identitas Brand
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kustomisasi logo perusahaan, nama sistem, profil badan usaha, dan preferensi keuangan.
              </p>
            </div>
          </div>
          <Link
            href="/pengaturan"
            className={buttonStyles("secondary", "sm")}
          >
            Buka Config Master
          </Link>
        </Card>
      )}

      {/* Kartu Kelola Foto Profil */}
      <Card padded>
        <AvatarUploadSection userId={user.id} name={user.name} />
      </Card>

      <Card padded>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs text-subtle-foreground">Nama</dt>
            <dd className="mt-1 break-words text-sm font-medium text-foreground">
              {user.name}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-subtle-foreground">Nama pengguna</dt>
            <dd className="mt-1 break-words text-sm font-medium text-foreground">
              {user.username}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-subtle-foreground">Peran otorisasi</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {USER_ROLE_LABELS[user.role] ?? user.role}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Kartu Pengaturan Notifikasi Perangkat HP & Web Push */}
      <DeviceNotificationCard />

      {/* Kartu Panduan Pasang PWA ke Layar Utama HP */}
      <InstallPwaCard />

      <Card>
        <CardHeader
          title="Ubah kata sandi"
          description="Dipakai saat masuk berikutnya."
        />
        <div className="space-y-4 p-5">
          {stored ? (
            <>
              <ChangePasswordForm />
              <p className="text-xs text-subtle-foreground">
                Sesi yang sudah masuk di perangkat lain tidak otomatis keluar
                dan tetap berlaku sampai kedaluwarsa.
              </p>
            </>
          ) : (
            <Alert tone="info">
              Akun ini masuk lewat pengaturan server (<code>BASIC_AUTH_USER</code>{" "}
              dan <code>BASIC_AUTH_PASS</code> di <code>.env</code>), bukan dari
              tabel pengguna. Kata sandinya diubah di file itu, lalu server
              dijalankan ulang.
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
