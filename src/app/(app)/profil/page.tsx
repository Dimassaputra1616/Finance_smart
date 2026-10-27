import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { hasStoredAccount } from "@/server/queries/users";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { Alert, Card, CardHeader } from "@/components/ui";

export const metadata = { title: "Profil" };

// Membaca sesi dan database pada setiap permintaan.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stored = await hasStoredAccount(user.id);

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
            <dt className="text-xs text-subtle-foreground">Peran</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {user.role === "ADMIN" ? "Administrator (Approver)" : "Staf"}
            </dd>
          </div>
        </dl>
      </Card>

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
