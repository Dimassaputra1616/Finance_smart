"use client";

import { cx } from "@/components/ui/Card";

/**
 * Karakter Bendahara Digital ("The Modern Corporate Treasurer").
 *
 * Ilustrasi vektor SVG presisi bertema perbendaharaan modern (Notion/Monocle inspired).
 * Menggunakan animasi mikro CSS murni:
 * - Badan & kepala melayang halus (gentle breathing float).
 * - Tangan dengan papan audit/nota berayun lembut meninjau angka.
 * - Kerlip bintang mikro pendar pada dokumen perbendaharaan.
 * - Kompatibel 100% pada mode terang (Warm Sandstone) dan mode gelap (Alpine Pine & Gold).
 */
export function TheTreasurer({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-28 w-28",
    md: "h-40 w-40 sm:h-44 sm:w-44",
    lg: "h-52 w-52 sm:h-60 sm:w-60",
  };

  return (
    <div
      className={cx(
        "relative flex items-center justify-center select-none",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      {/* Pendaran Latar Belakang (Ambient Halo) */}
      <div className="absolute inset-2 rounded-full bg-linear-to-tr from-primary/15 via-[#c49a45]/15 to-transparent blur-2xl dark:from-primary/25 dark:via-[#e8c77b]/20" />

      {/* SVG Karakter Vektor Editorial */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-full w-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="blazerGrad" x1="50" y1="90" x2="150" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#142d22" className="dark:stop-color-[#1b3d2f]" />
            <stop offset="1" stopColor="#0d1f17" className="dark:stop-color-[#0f241c]" />
          </linearGradient>

          <linearGradient id="goldAccent" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e8c77b" />
            <stop offset="1" stopColor="#c49a45" />
          </linearGradient>

          <linearGradient id="paperGrad" x1="120" y1="80" x2="170" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" className="dark:stop-color-[#e6ede9]" />
            <stop offset="1" stopColor="#f3f0e6" className="dark:stop-color-[#c9d4cd]" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes treasurer-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-4px) rotate(0.6deg); }
          }
          @keyframes arm-ledger {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-2.5deg); }
          }
          @keyframes sparkle-pulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
            50% { transform: scale(1.25) rotate(45deg); opacity: 1; }
          }
          @keyframes blink-eye {
            0%, 96%, 100% { transform: scaleY(1); }
            98% { transform: scaleY(0.1); }
          }
          .anim-treasurer { animation: treasurer-float 4.5s ease-in-out infinite; transform-origin: 100px 140px; }
          .anim-ledger { animation: arm-ledger 3.2s ease-in-out infinite; transform-origin: 125px 120px; }
          .anim-sparkle { animation: sparkle-pulse 2.4s ease-in-out infinite; transform-origin: 165px 78px; }
          .anim-eye { animation: blink-eye 4.2s infinite; transform-origin: center; }
          @media (prefers-reduced-motion: reduce) {
            .anim-treasurer, .anim-ledger, .anim-sparkle, .anim-eye { animation: none !important; }
          }
        `}</style>

        {/* Grup Karakter yang Melayang Lembut */}
        <g className="anim-treasurer">
          {/* Bayangan Dasar di Bawah Kursi/Badan */}
          <ellipse cx="100" cy="182" rx="42" ry="7" fill="currentColor" className="text-foreground/8 dark:text-black/40" />

          {/* Badan / Blazer Eksekutif Modern */}
          <path
            d="M58 140 C58 115, 78 105, 100 105 C122 105, 142 115, 142 140 L145 178 C145 180, 140 182, 100 182 C60 182, 55 180, 55 178 Z"
            fill="url(#blazerGrad)"
          />

          {/* Kemeja & Kerah V-Neck Rapi */}
          <path d="M88 105 L100 132 L112 105 Z" fill="#ffffff" className="dark:fill-[#e0eae3]" />
          {/* Dasi / Aksen Emas Sampanye Perbendaharaan */}
          <path d="M98 118 L102 118 L104 148 L100 152 L96 148 Z" fill="url(#goldAccent)" />

          {/* Leher */}
          <rect x="93" y="88" width="14" height="20" rx="4" fill="#f8d5b8" className="dark:fill-[#dfb696]" />

          {/* Kepala */}
          <circle cx="100" cy="72" r="23" fill="#f8d5b8" className="dark:fill-[#dfb696]" />

          {/* Rambut Gaya Crop Modern */}
          <path
            d="M77 68 C76 52, 90 44, 108 44 C124 44, 126 55, 125 64 C121 62, 114 62, 108 64 C100 66, 92 63, 85 68 C81 70, 78 72, 77 68 Z"
            fill="#1d2d24"
            className="dark:fill-[#0d1812]"
          />
          {/* Rambut Samping */}
          <path d="M77 65 C77 75, 78 80, 80 82" stroke="#1d2d24" strokeWidth="3" strokeLinecap="round" className="dark:stroke-[#0d1812]" />

          {/* Kacamata Arsitektural / Finansial Khas Treasury */}
          <g>
            <rect x="85" y="67" width="12" height="10" rx="3.5" fill="none" stroke="#e8c77b" strokeWidth="1.8" />
            <rect x="103" y="67" width="12" height="10" rx="3.5" fill="none" stroke="#e8c77b" strokeWidth="1.8" />
            <path d="M97 71 L103 71" stroke="#e8c77b" strokeWidth="1.8" />
          </g>

          {/* Mata yang Sesekali Mengedip Ramah */}
          <g className="anim-eye">
            <circle cx="91" cy="72" r="1.5" fill="#142d22" className="dark:fill-[#0a1711]" />
            <circle cx="109" cy="72" r="1.5" fill="#142d22" className="dark:fill-[#0a1711]" />
          </g>

          {/* Senyum Percaya Diri */}
          <path d="M96 81 Q100 84 104 81" stroke="#a36b4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Lengan Kiri Santai */}
          <path
            d="M60 128 C56 142, 62 162, 76 166"
            stroke="#142d22"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
            className="dark:stroke-[#1b3d2f]"
          />
          <circle cx="78" cy="166" r="5" fill="#f8d5b8" className="dark:fill-[#dfb696]" />

          {/* Lengan Kanan Memegang Papan Dokumen / Nota Digital */}
          <g className="anim-ledger">
            {/* Papan Klip Kayu / Leather Ledger Folder */}
            <rect
              x="118"
              y="98"
              width="44"
              height="58"
              rx="6"
              fill="#2c3e35"
              className="dark:fill-[#1b2b23] shadow-md"
              transform="rotate(-8 140 127)"
            />
            {/* Klip Logam Emas di Atas */}
            <rect
              x="132"
              y="93"
              width="16"
              height="6"
              rx="2"
              fill="url(#goldAccent)"
              transform="rotate(-8 140 96)"
            />

            {/* Lembar Nota / Laporan Bergaris */}
            <rect
              x="122"
              y="104"
              width="36"
              height="48"
              rx="3"
              fill="url(#paperGrad)"
              transform="rotate(-8 140 128)"
            />
            {/* Garis-Garis Angka Akuntansi pada Lembar Nota */}
            <path
              d="M127 114 L148 111 M127 122 L152 118 M127 130 L144 127 M127 138 L150 135"
              stroke="#687e72"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Tanda Centang Hijau / ACC Stamp di Nota */}
            <circle cx="145" cy="138" r="4.5" fill="#136c42" className="dark:fill-[#34d399]" />
            <path d="M143 138 L144.5 139.5 L147.5 136.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Tangan Kanan Memegang Papan */}
            <path
              d="M136 120 C130 132, 126 148, 124 158"
              stroke="#142d22"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
              className="dark:stroke-[#1b3d2f]"
            />
            <circle cx="123" cy="158" r="5" fill="#f8d5b8" className="dark:fill-[#dfb696]" />
          </g>

          {/* Bintang Kerlip Pendar (Accounting Precision Sparkle) */}
          <g className="anim-sparkle">
            <path
              d="M165 72 Q165 78 171 78 Q165 78 165 84 Q165 78 159 78 Q165 78 165 72 Z"
              fill="url(#goldAccent)"
            />
            <circle cx="174" cy="70" r="1.5" fill="#e8c77b" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default TheTreasurer;
