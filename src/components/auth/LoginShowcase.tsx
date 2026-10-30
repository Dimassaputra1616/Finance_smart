import { TheTreasurer } from "@/components/illustrations/TheTreasurer";
import { MascotSpeechBubble } from "@/components/illustrations/MascotSpeechBubble";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { getBrandLogoUrl, getBrandMascotUrl, type BrandConfig } from "@/lib/brand-config";
import { BrandMark } from "./BrandMark";

/**
 * Panel kiri halaman masuk: Elegan, lapang, dan berwibawa.
 *
 * Mengusung konsep Storytelling Showcase:
 * - Headline tipografi editorial tebal di sisi kiri.
 * - Maskot 3D Bendahara Digital dan Balon Kata Percakapan Animasi di sisi kanan.
 * - Bebas dari kotak-kotak bertumpuk yang membuat halaman terasa ramai.
 */
export function LoginShowcase({ brand }: { brand?: BrandConfig }) {
  const appName = brand?.appName ?? APP_NAME;
  const appTagline = brand?.appTagline ?? APP_TAGLINE;
  const logoUrl = getBrandLogoUrl(brand);
  return (
    <aside
      aria-label="Tentang aplikasi"
      className="relative hidden overflow-hidden border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar-2 px-8 py-6 text-sidebar-foreground sm:px-10 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-10 lg:py-7 xl:px-14 xl:py-8 2xl:px-20"
    >
      {/* ======================================================== */}
      {/* 1. ANIMASI LATAR BELAKANG AMBIENT (RINGAN, 100% GPU)     */}
      {/* ======================================================== */}
      <style>{`
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(40px, -35px, 0) scale(1.15); }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-35px, 40px, 0) scale(1.18); }
        }
        @keyframes aurora-drift-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(25px, 30px, 0) scale(0.92); }
        }
        .anim-aurora-1 { animation: aurora-drift-1 18s ease-in-out infinite; will-change: transform; }
        .anim-aurora-2 { animation: aurora-drift-2 22s ease-in-out infinite; will-change: transform; }
        .anim-aurora-3 { animation: aurora-drift-3 26s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .anim-aurora-1, .anim-aurora-2, .anim-aurora-3 { animation: none !important; }
        }
      `}</style>

      {/* Tiga Bola Cahaya Ambient Bernapas (Floating Aurora Mesh) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-96 w-96 rounded-full bg-sidebar-brand-from/20 blur-3xl transform-gpu anim-aurora-1"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-16 h-96 w-96 rounded-full bg-primary/15 blur-3xl transform-gpu anim-aurora-2"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/12 blur-3xl transform-gpu anim-aurora-3"
      />

      {/* Kisi Titik Halus Moneter (Matrix Grid yang Menangkap Pendaran Cahaya) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ======================================================== */}
      {/* 2. HEADER IDENTITAS MEREK (Tinggi persis setara h-11)    */}
      {/* ======================================================== */}
      <div className="relative z-10 flex h-11 items-center gap-3 group cursor-default">
        <BrandMark
          logoUrl={logoUrl}
          hasCustomLogo={brand?.hasCustomLogo}
          shape={brand?.logoShape}
          className="h-10 w-10 text-xs shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-md"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground transition-colors duration-200 group-hover:text-sidebar-brand-from">
            {appName}
          </p>
          <p className="truncate text-xs text-sidebar-muted">{appTagline}</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KONTEN UTAMA: MASKOT 3D (KIRI) & BALON KATA (DEKAT)   */}
      {/* ======================================================== */}
      <div className="relative z-10 my-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-5 xl:gap-8 2xl:gap-12 py-3 px-2 w-full max-w-5xl mx-auto">
        {/* Sisi Kiri: Karakter 3D Bendahara Digital (Dekat & Pas) */}
        <div className="shrink-0 flex flex-col items-center justify-center">
          <TheTreasurer size="lg" mascotUrl={getBrandMascotUrl(brand)} />
        </div>

        {/* Sisi Kanan: Balon Percakapan Melayang Sejajar Bahu/Wajah Maskot */}
        <div className="shrink-0 flex items-center justify-center lg:self-start lg:mt-6 xl:mt-8 2xl:mt-10 lg:-ml-2">
          <MascotSpeechBubble tailPosition="left" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. FOOTER STATUS SISTEM (Presisi Sejajar Horisontal)     */}
      {/* ======================================================== */}
      <div className="relative z-10 flex h-6 items-center justify-between border-t border-sidebar-border pt-3.5 text-[11px] text-sidebar-muted">
        <span className="font-mono">Zona waktu Asia/Jakarta (WIB)</span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-income" />
          Jaringan Terproteksi
        </span>
      </div>
    </aside>
  );
}
