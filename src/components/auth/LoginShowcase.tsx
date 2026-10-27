import { IconReceipt, IconScale, IconShield } from "@/components/Icons";
import { TheTreasurer } from "@/components/illustrations/TheTreasurer";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { BrandMark } from "./BrandMark";

/**
 * Hanya hal yang benar-benar dilakukan aplikasi. Tidak ada angka saldo atau
 * transaksi contoh: di layar yang bisa dilihat siapa pun sebelum masuk, angka
 * karangan terlihat seperti kebocoran data, dan klaim yang tidak bisa dibuktikan
 * ("Keamanan Tingkat Perusahaan", "Akses Terenkripsi") dibuang.
 */
const FEATURES = [
  {
    icon: IconShield,
    title: "Pengeluaran staf perlu persetujuan",
    text: "Pengajuan baru belum memengaruhi saldo kas sampai disetujui administrator.",
  },
  {
    icon: IconReceipt,
    title: "Bukti nota ikut tersimpan",
    text: "Foto struk dilampirkan saat mencatat dan bisa dibuka lagi kapan saja.",
  },
  {
    icon: IconScale,
    title: "Ringkasan kas dalam satu layar",
    text: "Penerimaan, pengeluaran, dan saldo tiap rekening per bulan.",
  },
] as const;

/**
 * Panel kiri halaman login. Hanya tampil di layar lebar (`lg` ke atas).
 *
 * Halaman login tidak boleh punya scroll, jadi tinggi panel ini harus muat di
 * layar apa pun yang umum, termasuk laptop berlayar pendek. Alih-alih mengecil
 * tak terbatas, isinya dikurangi menurut TINGGI layar (kelas di `globals.css`):
 *   - di bawah 780px: ilustrasi disembunyikan
 *   - di bawah 600px: deskripsi poin disembunyikan, judulnya tetap
 * Hanya menyembunyikan dekorasi dan teks pendukung; merek, judul, dan ketiga
 * poin selalu tampil.
 */
export function LoginShowcase() {
  return (
    <aside
      aria-label="Tentang aplikasi"
      className="relative hidden overflow-hidden border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar-2 p-10 text-sidebar-foreground lg:flex lg:w-[44%] lg:flex-col lg:justify-between xl:p-12"
    >
      {/* Tekstur titik, murni dekorasi. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex items-center gap-3">
        <BrandMark className="h-10 w-10 text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="truncate text-xs text-sidebar-muted">{APP_TAGLINE}</p>
        </div>
      </div>

      <div className="relative my-auto max-w-md space-y-6 py-6">
        {/* Karakternya berjas pinus gelap. Di mode gelap latar panel ini juga
            pinus, jadi tanpa alas ia menyatu dengan latar. Alas `surface`
            adalah latar yang sama dengan kartu sambutan di dashboard. */}
        <div className="hide-on-short-screen w-fit rounded-3xl border border-sidebar-border bg-surface p-3 shadow-card">
          <TheTreasurer size="sm" />
        </div>

        <h2 className="text-xl font-semibold leading-snug tracking-tight xl:text-2xl">
          Kas tercatat rapi, setiap pengeluaran disetujui.
        </h2>

        <ul className="space-y-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-sidebar-active text-sidebar-brand-from"
              >
                <Icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="hide-on-tiny-screen mt-0.5 text-sm leading-relaxed text-sidebar-muted">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative border-t border-sidebar-border pt-3 text-xs text-sidebar-muted">
        Zona waktu Asia/Jakarta (WIB)
      </p>
    </aside>
  );
}
