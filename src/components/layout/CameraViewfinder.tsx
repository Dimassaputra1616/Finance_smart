"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose, IconCheck, IconRotate } from "@/components/Icons";

/**
 * Viewfinder Kamera Langsung di dalam Aplikasi (In-App Camera).
 *
 * Menggunakan WebRTC `navigator.mediaDevices.getUserMedia` untuk menyajikan
 * tampilan kamera belakang langsung di layar ponsel/laptop, lengkap dengan
 * panduan bingkai nota dan tombol rana (shutter).
 *
 * Menggunakan React Portal (document.body) agar tidak terperangkap oleh
 * stacking context atau backdrop-filter bar navigasi bawah.
 */
export function CameraViewfinder({
  isOpen,
  onClose,
  onCapture,
  onFallback,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallback: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mounted, setMounted] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [streamAttempt, setStreamAttempt] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup kamera dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Matikan stream saat modal ditutup
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedUrl(null);
      setCapturedBlob(null);
      setErrorText(null);
      return;
    }

    let isSubscribed = true;

    async function initCamera() {
      stopStream();
      setErrorText(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        onFallback();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!isSubscribed) return;
        // Jika akses stream gagal/ditolak, beralih ke input kamera bawaan
        setErrorText("Tidak dapat mengakses kamera langsung.");
      }
    }

    initCamera();

    return () => {
      isSubscribed = false;
      stopStream();
    };
  }, [isOpen, facingMode, streamAttempt, onFallback]);

  if (!isOpen || !mounted) return null;

  // Jepret foto dari frame video
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        setCapturedBlob(blob);
        stopStream();
      },
      "image/jpeg",
      0.9,
    );
  };

  // Gunakan foto hasil jepretan
  const confirmPhoto = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `nota_${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    onCapture(file);
    onClose();
  };

  // Ulangi foto
  const retakePhoto = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedUrl(null);
    setCapturedBlob(null);
    // Nyalakan ulang stream kamera
    setStreamAttempt((v) => v + 1);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white h-dvh w-screen"
    >
      {/* Top Bar Kontrol */}
      <div className="relative z-10 flex items-center justify-between p-4 backdrop-blur-xs bg-black/40">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kamera"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md active:scale-95 transition cursor-pointer"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-white/80 font-mono">
          {capturedUrl ? "Pratinjau Hasil Jepretan" : "Pindai Bukti Nota"}
        </span>

        {/* Spacer kanan agar judul tetap di tengah */}
        <div className="w-10" />
      </div>

      {/* Area Viewfinder / Preview */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black">
        {!capturedUrl ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover"
            />

            {/* Bingkai Panduan Nota (Receipt Framing Box) */}
            <div className="pointer-events-none absolute inset-x-8 inset-y-16 rounded-3xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <span className="h-4 w-4 border-t-2 border-l-2 border-primary" />
                <span className="h-4 w-4 border-t-2 border-r-2 border-primary" />
              </div>
              <p className="text-center text-xs font-medium text-white/90 drop-shadow-md bg-black/50 py-1.5 px-3 rounded-full mx-auto backdrop-blur-xs">
                Posisikan nota atau struk di dalam kotak
              </p>
              <div className="flex justify-between">
                <span className="h-4 w-4 border-b-2 border-l-2 border-primary" />
                <span className="h-4 w-4 border-b-2 border-r-2 border-primary" />
              </div>
            </div>

            {errorText && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-black/85 border border-white/20 p-5 text-center space-y-3">
                <p className="text-sm font-medium text-white">{errorText}</p>
                <button
                  type="button"
                  onClick={onFallback}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Buka Kamera Sistem HP
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="relative h-full w-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedUrl}
              alt="Hasil jepretan nota"
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="relative z-10 flex items-center justify-around p-6 pb-12 bg-black/80 backdrop-blur-md">
        {!capturedUrl ? (
          <div className="flex w-full items-center justify-between max-w-sm mx-auto px-4">
            <button
              type="button"
              onClick={onFallback}
              className="text-[11px] text-white/75 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Kamera HP
            </button>

            {/* Shutter Button Bulat Besar */}
            <button
              type="button"
              onClick={takeSnapshot}
              title="Jepret Foto Nota"
              aria-label="Ambil foto"
              className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-white/20 p-1.5 active:scale-90 transition duration-150 shadow-2xl cursor-pointer"
            >
              <span className="h-full w-full rounded-full bg-white shadow-inner" />
            </button>

            {/* Tombol Ganti Kamera Depan / Belakang */}
            <button
              type="button"
              onClick={toggleCamera}
              title="Ganti Kamera Depan / Belakang"
              aria-label="Putar kamera"
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white cursor-pointer active:scale-90 transition"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-xs">
                <IconRotate className="h-4 w-4" />
              </span>
              <span className="text-[10px] text-white/70">Putar</span>
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center gap-4 max-w-sm mx-auto">
            <button
              type="button"
              onClick={retakePhoto}
              className="flex-1 min-h-12 rounded-2xl border border-white/30 bg-white/10 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
            >
              Foto Ulang
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              className="flex-1 min-h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white shadow-lg active:scale-95 transition cursor-pointer"
            >
              <IconCheck className="h-4 w-4" />
              <span>Gunakan Foto</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
