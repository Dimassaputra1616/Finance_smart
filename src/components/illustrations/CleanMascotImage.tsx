"use client";

import { useEffect, useState } from "react";

/**
 * Komponen pembersih latar belakang kotak-kotak catur (fake-checkerboard)
 * secara instan di peramban menggunakan Canvas 2D API.
 * Menghasilkan siluet karakter 3D yang benar-benar transparan menyatu dengan latar.
 */
export function CleanMascotImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [cleanSrc, setCleanSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setCleanSrc(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Masukkan seluruh piksel tepi luar (boundary) ke antrian flood-fill
        for (let x = 0; x < width; x++) {
          queue.push(x, 0);
          queue.push(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          queue.push(0, y);
          queue.push(width - 1, y);
        }

        let head = 0;
        while (head < queue.length) {
          const x = queue[head++];
          const y = queue[head++];
          const pixelIdx = y * width + x;

          if (visited[pixelIdx]) continue;
          visited[pixelIdx] = 1;

          const idx = pixelIdx * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Deteksi kotak catur: warna abu-abu netral atau putih terang di luar siluet
          const diffRG = Math.abs(r - g);
          const diffGB = Math.abs(g - b);
          const diffRB = Math.abs(r - b);
          const isCheckerboard =
            diffRG <= 15 && diffGB <= 15 && diffRB <= 15 && r >= 150;

          if (isCheckerboard) {
            data[idx + 3] = 0; // Ubah menjadi transparan penuh

            // Teruskan ke 4 tetangga terdekat
            if (x > 0 && !visited[pixelIdx - 1]) queue.push(x - 1, y);
            if (x < width - 1 && !visited[pixelIdx + 1]) queue.push(x + 1, y);
            if (y > 0 && !visited[pixelIdx - width]) queue.push(x, y - 1);
            if (y < height - 1 && !visited[pixelIdx + width]) queue.push(x, y + 1);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setCleanSrc(canvas.toDataURL("image/png"));
      } catch {
        setCleanSrc(src);
      }
    };

    img.onerror = () => {
      setCleanSrc(src);
    };
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanSrc || src}
      alt={alt}
      className={className}
    />
  );
}
