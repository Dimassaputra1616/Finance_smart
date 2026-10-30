/**
 * Kompresi dan konversi gambar bukti transaksi di browser menggunakan HTML5 Canvas.
 *
 * Mendukung JPEG, PNG, WebP, dan foto kamera iPhone (.heic / .heif).
 * Mengubah resolusi ke maksimal 1600px pada sisi terpanjang dan mengonversi
 * ke format WebP kualitas 80%.
 *
 * Menghasilkan file ~150-250 KB dari foto asli kamera HP 4-12 MB dengan
 * ketajaman teks nota/kuitansi tetap tajam terbaca (tidak pecah/blur).
 *
 * Bila browser tidak mendukung decoding HEIC di sisi klien, file diteruskan
 * apa adanya dan akan dikonversi ke WebP secara otomatis oleh server (sharp).
 */

/** Periksa apakah file adalah gambar berdasarkan MIME type atau ekstensi nama berkas. */
export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name);
}

/** Periksa apakah file adalah format foto kamera iPhone (HEIC/HEIF). */
export function isHeicFile(file: File): boolean {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  return /\.(heic|heif)$/i.test(file.name);
}

/**
 * Hitung dimensi proporsional agar tidak melebihi `maxDimension` pada sisi terpanjang.
 */
export function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      return {
        width: maxDimension,
        height: Math.max(1, Math.round((height * maxDimension) / width)),
      };
    }
    return {
      width: Math.max(1, Math.round((width * maxDimension) / height)),
      height: maxDimension,
    };
  }

  return { width, height };
}

/** Render drawable (ImageBitmap atau HTMLImageElement) ke canvas WebP. */
function renderDrawableToWebP(
  drawable: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  fileName: string,
  maxDimension: number,
  quality: number,
): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const { width, height } = calculateScaledDimensions(
        sourceWidth,
        sourceHeight,
        maxDimension,
      );

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(drawable, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const cleanBaseName = fileName.replace(/\.[^/.]+$/, "");
          const webpFile = new File([blob], `${cleanBaseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(webpFile);
        },
        "image/webp",
        quality,
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * Kompresi dan konversi file gambar ke format WebP.
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1600,
  quality = 0.8,
): Promise<File> {
  // Hanya proses jika file adalah gambar
  if (!isImageFile(file)) {
    return file;
  }

  // 1. Coba decode via createImageBitmap (didukung browser modern & Safari untuk HEIC)
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      const converted = await renderDrawableToWebP(
        bitmap,
        bitmap.width,
        bitmap.height,
        file.name,
        maxDimension,
        quality,
      );
      bitmap.close?.();
      if (converted) return converted;
    } catch {
      // Lanjutkan ke metode fallback Image
    }
  }

  // 2. Fallback via FileReader & HTMLImageElement
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof FileReader === "undefined") {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        const converted = await renderDrawableToWebP(
          img,
          img.width,
          img.height,
          file.name,
          maxDimension,
          quality,
        );
        resolve(converted || file);
      };

      // Jika browser tidak dapat me-render (misal HEIC di browser tanpa decoder),
      // kembalikan file asli agar server (sharp) yang menangani konversinya.
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

/**
 * Otomatis mengonversi dan mengoptimasi berkas logo yang diunggah pengguna.
 *
 * 1. Jika berkas adalah SVG (vektor), dibiarkan asli agar ketajaman tak terbatas terjaga.
 * 2. Jika berkas adalah gambar raster apa pun (PNG, JPG, WebP, dsb) dalam ukuran/rasio apa pun:
 *    - Otomatis dibuatkan kanvas bujur sangkar (512x512) dengan latar transparan.
 *    - Logo diposisikan pas di tengah (center fit) tanpa terdistorsi/terpotong.
 *    - Dikonversi ke format WebP berkualitas tinggi dengan transparansi (alpha channel) terjaga.
 *    - Ukuran berkas otomatis terpangkas drastis (dari 5-15 MB kamera menjadi ~20-60 KB).
 */
export async function optimizeLogoImage(
  file: File,
  targetSize = 512,
): Promise<File> {
  // SVG dibiarkan asli tanpa konversi raster
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Jika bukan gambar yang bisa diproses, kembalikan file asli
  if (!isImageFile(file)) {
    return file;
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Hitung scaling "contain" agar rasio logo asli terjaga dan berada persis di tengah
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const drawWidth = Math.round(img.width * scale);
        const drawHeight = Math.round(img.height * scale);
        const offsetX = Math.round((targetSize - drawWidth) / 2);
        const offsetY = Math.round((targetSize - drawHeight) / 2);

        // Bersihkan kanvas (transparan penuh)
        ctx.clearRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

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
          0.9,
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

