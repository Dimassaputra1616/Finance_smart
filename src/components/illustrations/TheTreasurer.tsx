import { cx } from "@/components/ui/Card";
import { MascotSpeechBubble } from "./MascotSpeechBubble";

export type TreasurerSize = "sm" | "md" | "lg" | "xl";

interface SizeSpec {
  img: string;
  stage: string;
  innerStage: string;
  shadow: string;
}

const SIZE_MAP: Record<TreasurerSize, SizeSpec> = {
  sm: {
    img: "h-36 sm:h-44",
    stage: "h-7 w-36 sm:w-44",
    innerStage: "h-3.5 w-28 sm:w-36",
    shadow: "h-2 w-20 sm:w-26",
  },
  md: {
    img: "h-56 sm:h-64",
    stage: "h-8 w-48 sm:w-56",
    innerStage: "h-4.5 w-36 sm:w-44",
    shadow: "h-2.5 w-28 sm:w-32",
  },
  lg: {
    img: "h-72 sm:h-80 lg:h-[25rem] xl:h-[30rem] 2xl:h-[35rem]",
    stage: "h-8 w-52 sm:w-60 lg:h-10 lg:w-72 xl:h-11 xl:w-84 2xl:h-12 2xl:w-96",
    innerStage: "h-4.5 w-40 sm:w-48 lg:h-5.5 lg:w-56 xl:h-6 xl:w-68 2xl:h-7 2xl:w-76",
    shadow: "h-2.5 w-32 sm:w-36 lg:h-3 lg:w-44 xl:h-4 xl:w-52 2xl:h-4.5 2xl:w-60",
  },
  xl: {
    img: "h-[22rem] sm:h-[26rem] lg:h-[32rem] xl:h-[38rem] 2xl:h-[44rem]",
    stage: "h-9 w-60 sm:w-72 lg:h-11 lg:w-84 xl:h-13 xl:w-96 2xl:h-14 2xl:w-[28rem]",
    innerStage: "h-5 w-48 sm:w-56 lg:h-6 lg:w-68 xl:h-7.5 xl:w-76 2xl:h-8 2xl:w-88",
    shadow: "h-3 w-36 sm:w-44 lg:h-4 lg:w-52 xl:h-5 xl:w-60 2xl:h-5.5 2xl:w-68",
  },
};

/**
 * Karakter Bendahara Digital ("The 3D Corporate Treasurer").
 *
 * Menampilkan karakter 3D berkualitas tinggi yang berdiri di atas panggung elips 3D
 * berpendar lembut (Luminous 3D Stage Ring) dengan bayangan lantai realistis.
 * Skala visual proporsional otomatis di monitor laptop, desktop standar, hingga ultrawide.
 */
export function TheTreasurer({
  className,
  size = "md",
  withSpeechBubble = false,
  mascotUrl = "/api/mascot",
}: {
  className?: string;
  size?: TreasurerSize;
  withSpeechBubble?: boolean;
  mascotUrl?: string;
}) {
  const { img, stage, innerStage, shadow } = SIZE_MAP[size];

  return (
    <div
      suppressHydrationWarning
      className={cx(
        "relative flex flex-col items-center justify-center select-none group",
        className,
      )}
    >
      {/* Balon Percakapan Melayang di Atas Kepala Karakter */}
      {withSpeechBubble && (
        <MascotSpeechBubble tailPosition="bottom" className="mb-4 shrink-0" />
      )}

      <div className="relative flex flex-col items-center justify-center" aria-hidden="true">
        {/* Pendaran Cahaya Ambient 3D di Belakang Karakter */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-1/4 bottom-10 rounded-full bg-linear-to-tr from-sidebar-brand-to/30 via-primary/20 to-accent/20 blur-3xl transform-gpu"
        />

        {/* Gambar Karakter 3D Transparan Asli */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mascotUrl}
          alt="Bendahara Digital 3D"
          className={cx(
            "relative z-10 w-auto object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105",
            img,
          )}
        />

        {/* ======================================================== */}
        {/* PANGGUNG 3D REFLEKTIF (LUMINOUS STAGE RING) DI LANTAI   */}
        {/* ======================================================== */}
        <div className="relative -mt-4.5 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
          {/* Cincin Luar (Outer Halo Ring) */}
          <div
            className={cx(
              "relative flex items-center justify-center rounded-full border border-sidebar-brand-to/35 bg-sidebar-brand-to/5 shadow-2xl backdrop-blur-xs transition-colors duration-300 group-hover:border-sidebar-brand-to/60",
              stage,
            )}
          >
            {/* Cincin Dalam Konsentris (Inner Ring) */}
            <div
              className={cx(
                "rounded-full border border-sidebar-brand-from/30 bg-sidebar-active/15 transition-colors duration-300 group-hover:border-sidebar-brand-from/50",
                innerStage,
              )}
            />

            {/* Bayangan Kontak Sepatu (Ground Contact Shadow) */}
            <div className={cx("absolute rounded-full bg-black/55 blur-xs", shadow)} />
          </div>

          {/* Pendaran Cahaya Halus di Lantai */}
          <div className="absolute h-10 w-44 rounded-full bg-primary/10 blur-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export default TheTreasurer;
