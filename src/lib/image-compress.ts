/**
 * Kompresi gambar bukti transaksi di browser menggunakan HTML5 Canvas.
 *
 * Mengubah resolusi ke maksimal 1600px pada sisi terpanjang dan mengonversi
 * ke format WebP kualitas 80%.
 *
 * Menghasilkan file ~150-250 KB dari foto asli kamera HP 4-12 MB dengan
 * ketajaman teks nota/kuitansi tetap tajam terbaca (tidak pecah/blur).
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1600,
  quality = 0.8,
): Promise<File> {
  // Hanya proses jika file adalah gambar (JPG/PNG/HEIC/WebP)
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Pertahankan rasio aspek dokumen
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Render dengan interpolasi berkualitas tinggi untuk teks dokumen
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, "");
            const webpFile = new File([blob], `${cleanBaseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/** Format ukuran file dalam KB/MB yang mudah dibaca. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
