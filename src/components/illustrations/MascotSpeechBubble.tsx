"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/Card";

const SPEECH_SLIDES = [
  {
    tag: "KONSOL UTAMA",
    text: "Selamat datang di Konsol Perbendaharaan & Kas.",
  },
  {
    tag: "OTORISASI KAS",
    text: "Pengeluaran staf memerlukan persetujuan pimpinan sebelum memotong saldo.",
  },
  {
    tag: "BUKTI KUITANSI",
    text: "Foto nota otomatis dikompresi tajam dan tersimpan permanen di server.",
  },
  {
    tag: "INTEGRITAS SALDO",
    text: "Arus kas tercatat tertutup dan konsisten tanpa nominal negatif.",
  },
  {
    tag: "PAGU ANGGARAN",
    text: "Setiap pos belanja dipantau real-time terhadap batas anggaran bulanan.",
  },
  {
    tag: "KONSOLIDASI REKENING",
    text: "Pantau kas fisik operasional, rekening bank, hingga e-wallet dalam satu neraca.",
  },
] as const;

/**
 * Balon Percakapan Animasi Berganti Teks (Sliding Speech Bubble) untuk Maskot 3D.
 *
 * Gaya: Transparan Kaca (Glassmorphic Frosted Glass) dengan tipografi tegas & tebal.
 * Fitur:
 * - Teks berganti otomatis tiap 4.5 detik dengan animasi slide-up halus.
 * - Berhenti otomatis saat kursor diarahkan (pause on hover) agar nyaman dibaca.
 * - Dilengkapi indikator titik (dots) interaktif yang bisa diklik.
 * - Ekor balon mengarah ke kepala maskot di bawahnya.
 */
export function MascotSpeechBubble({
  className,
  tailPosition = "bottom",
}: {
  className?: string;
  tailPosition?: "bottom" | "bottom-left" | "right" | "left";
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SPEECH_SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const current = SPEECH_SLIDES[currentIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cx(
        "relative z-30 w-72 sm:w-80 lg:w-84 xl:w-96 2xl:w-[26rem] select-none cursor-default rounded-3xl border border-sidebar-border/70 bg-sidebar-active/35 p-4 sm:p-5 xl:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-sidebar-border hover:bg-sidebar-active/50 hover:shadow-sidebar",
        className,
      )}
      role="region"
      aria-label="Penjelasan aplikasi oleh Bendahara Digital"
      aria-live="polite"
    >
      <style>{`
        @keyframes bubble-slide {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .anim-bubble-text {
          animation: bubble-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-bubble-text { animation: none !important; }
        }
      `}</style>

      {/* Konten Slide dengan Teks Lebih Besar & Tebal */}
      <div key={currentIndex} className="anim-bubble-text space-y-1.5 xl:space-y-2">
        <div>
          <span className="inline-flex items-center rounded-lg border border-sidebar-border/70 bg-sidebar-active/70 px-2.5 py-0.5 text-[11px] xl:text-xs font-bold font-mono tracking-wider uppercase text-sidebar-brand-from shadow-2xs">
            {current.tag}
          </span>
        </div>

        <p className="min-h-[2.8rem] xl:min-h-[3.2rem] flex items-center text-sm sm:text-base xl:text-lg font-bold text-sidebar-foreground leading-snug">
          {current.text}
        </p>
      </div>

      {/* Indikator Titik (Interactive Dots) Bersih & Terpusat */}
      <div className="mt-2.5 flex items-center justify-center pt-2 border-t border-sidebar-border/40">
        <div className="flex items-center gap-1.5">
          {SPEECH_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Lihat penjelasan ${idx + 1}`}
              className={cx(
                "h-2 transition-all duration-300 rounded-full cursor-pointer",
                idx === currentIndex
                  ? "w-5 bg-sidebar-brand-from"
                  : "w-2 bg-sidebar-border hover:bg-sidebar-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Ekor Balon Percakapan Menunjuk Lurus ke Kepala Maskot di Bawah */}
      {tailPosition === "bottom" && (
        <div
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rotate-45 border-b border-r border-sidebar-border/70 bg-sidebar-active/35 backdrop-blur-2xl"
        />
      )}
      {tailPosition === "bottom-left" && (
        <div
          aria-hidden="true"
          className="absolute -bottom-2 left-7 h-3.5 w-3.5 rotate-45 border-b border-r border-sidebar-border/70 bg-sidebar-active/35 backdrop-blur-2xl"
        />
      )}
      {tailPosition === "right" && (
        <div
          aria-hidden="true"
          className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 border-t border-r border-sidebar-border/70 bg-sidebar-active/35 backdrop-blur-2xl"
        />
      )}
      {tailPosition === "left" && (
        <div
          aria-hidden="true"
          className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 border-b border-l border-sidebar-border/70 bg-sidebar-active/35 backdrop-blur-2xl"
        />
      )}
    </div>
  );
}
