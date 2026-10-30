import "server-only";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_BRAND_CONFIG, type BrandConfig } from "@/lib/brand-config";

const BRAND_DIR = path.join(process.cwd(), "storage", "brand");
const CONFIG_FILE = path.join(BRAND_DIR, "config.json");

const SUPPORTED_LOGO_EXTENSIONS = ["svg", "webp", "png"] as const;

/** Cache konfigurasi brand di RAM server agar pembacaan layout instan tanpa disk I/O. */
let memoryCachedConfig: BrandConfig | null = null;

/**
 * Membaca konfigurasi identitas brand dari penyimpanan lokal server.
 * Mengembalikan konfigurasi baku jika berkas belum ada atau rusak.
 */
export async function getBrandConfig(): Promise<BrandConfig> {
  if (memoryCachedConfig) {
    return memoryCachedConfig;
  }

  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const config: BrandConfig = {
      ...DEFAULT_BRAND_CONFIG,
      ...parsed,
    };

    // Pastikan status keberadaan logo sesuai dengan berkas fisik di disk
    if (config.hasCustomLogo) {
      const logo = await findExistingLogoFile();
      if (!logo) {
        config.hasCustomLogo = false;
      }
    }

    // Pastikan status keberadaan maskot kustom sesuai dengan berkas fisik di disk
    if (config.hasCustomMascot) {
      const mascot = await findExistingMascotFile();
      if (!mascot) {
        config.hasCustomMascot = false;
      }
    }

    memoryCachedConfig = config;
    return config;
  } catch {
    memoryCachedConfig = { ...DEFAULT_BRAND_CONFIG };
    return memoryCachedConfig;
  }
}

/**
 * Menyimpan pembaruan konfigurasi identitas brand.
 */
export async function saveBrandConfig(
  updates: Partial<BrandConfig>,
  updatedBy?: string,
): Promise<boolean> {
  try {
    await fs.mkdir(BRAND_DIR, { recursive: true });
    const current = await getBrandConfig();
    const nextConfig: BrandConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(updatedBy ? { updatedBy } : {}),
    };

    await fs.writeFile(CONFIG_FILE, JSON.stringify(nextConfig, null, 2), "utf-8");
    memoryCachedConfig = nextConfig;
    return true;
  } catch {
    return false;
  }
}

/**
 * Mencari berkas logo fisik yang ada di direktori penyimpanan.
 */
async function findExistingLogoFile(): Promise<{ fileName: string; ext: string } | null> {
  for (const ext of SUPPORTED_LOGO_EXTENSIONS) {
    const fileName = `logo.${ext}`;
    try {
      await fs.access(path.join(BRAND_DIR, fileName));
      return { fileName, ext };
    } catch {
      // Lanjutkan cek format berikutnya
    }
  }
  return null;
}

/**
 * Menyimpan berkas logo baru ke server.
 * Mendukung SVG, PNG, WebP, JPEG, dan gambar umum lainnya.
 */
export async function saveBrandLogoFile(
  file: File,
  updatedBy?: string,
): Promise<{ ok: boolean; message?: string }> {
  // Batas ukuran 15 MB agar foto kamera resolusi tinggi dari HP bisa langsung diunggah
  const MAX_SIZE = 15 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { ok: false, message: "Ukuran berkas logo maksimal 15 MB." };
  }

  const name = file.name.toLowerCase();
  const isSvg = file.type === "image/svg+xml" || name.endsWith(".svg");
  const isPng = file.type === "image/png" || name.endsWith(".png");
  const isWebp = file.type === "image/webp" || name.endsWith(".webp");
  const isJpeg = file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");

  if (!isSvg && !isPng && !isWebp && !isJpeg && !file.type.startsWith("image/")) {
    return { ok: false, message: "Format berkas harus berupa gambar (PNG, JPG, WebP, SVG, dsb)." };
  }

  try {
    await fs.mkdir(BRAND_DIR, { recursive: true });

    // Hapus logo lama terlebih dahulu agar tidak ada konflik format
    await removeRawLogoFiles();

    const buffer = Buffer.from(await file.arrayBuffer());

    let targetExt = "webp";
    let targetBuffer = buffer;

    if (isSvg) {
      targetExt = "svg";
      targetBuffer = buffer;
    } else if (isPng) {
      targetExt = "png";
      targetBuffer = buffer;
    } else {
      // Coba kompres/konversi ke WebP menggunakan sharp jika tersedia
      try {
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default || sharpModule;
        targetBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
        targetExt = "webp";
      } catch {
        targetExt = "webp";
      }
    }

    const targetPath = path.join(BRAND_DIR, `logo.${targetExt}`);
    await fs.writeFile(targetPath, targetBuffer);

    // Perbarui konfigurasi brand
    await saveBrandConfig(
      {
        hasCustomLogo: true,
        logoVersion: Date.now(),
      },
      updatedBy,
    );

    return { ok: true };
  } catch {
    return { ok: false, message: "Terjadi kesalahan saat menyimpan berkas logo di server." };
  }
}

/**
 * Membaca berkas logo dari disk untuk disajikan lewat API route.
 */
export async function readBrandLogoFile(): Promise<{ buffer: Buffer; contentType: string } | null> {
  const found = await findExistingLogoFile();
  if (!found) return null;

  try {
    const fullPath = path.join(BRAND_DIR, found.fileName);
    const buffer = await fs.readFile(fullPath);

    let contentType = "image/webp";
    if (found.ext === "svg") contentType = "image/svg+xml";
    if (found.ext === "png") contentType = "image/png";

    return { buffer, contentType };
  } catch {
    return null;
  }
}

/**
 * Menghapus berkas fisik logo di disk.
 */
async function removeRawLogoFiles(): Promise<void> {
  for (const ext of SUPPORTED_LOGO_EXTENSIONS) {
    try {
      await fs.unlink(path.join(BRAND_DIR, `logo.${ext}`));
    } catch {
      // Abaikan jika berkas tidak ada
    }
  }
}

/**
 * Menghapus logo kustom dan mengembalikan tanda brand ke default monogram Rp.
 */
export async function deleteBrandLogoFile(updatedBy?: string): Promise<boolean> {
  try {
    await removeRawLogoFiles();
    await saveBrandConfig(
      {
        hasCustomLogo: false,
        logoVersion: Date.now(),
      },
      updatedBy,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Mencari berkas maskot kustom fisik yang ada di direktori penyimpanan.
 */
async function findExistingMascotFile(): Promise<{ fileName: string; ext: string } | null> {
  for (const ext of SUPPORTED_LOGO_EXTENSIONS) {
    const fileName = `mascot.${ext}`;
    try {
      await fs.access(path.join(BRAND_DIR, fileName));
      return { fileName, ext };
    } catch {
      // Lanjutkan format berikutnya
    }
  }
  return null;
}

/**
 * Menyimpan berkas maskot karakter baru ke server.
 */
export async function saveBrandMascotFile(
  file: File,
  updatedBy?: string,
): Promise<{ ok: boolean; message?: string }> {
  const MAX_SIZE = 15 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { ok: false, message: "Ukuran berkas maskot maksimal 15 MB." };
  }

  const name = file.name.toLowerCase();
  const isSvg = file.type === "image/svg+xml" || name.endsWith(".svg");
  const isPng = file.type === "image/png" || name.endsWith(".png");
  const isWebp = file.type === "image/webp" || name.endsWith(".webp");
  const isJpeg = file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");

  if (!isSvg && !isPng && !isWebp && !isJpeg && !file.type.startsWith("image/")) {
    return { ok: false, message: "Format berkas harus berupa gambar (PNG transparan disarankan, WebP, JPG, SVG)." };
  }

  try {
    await fs.mkdir(BRAND_DIR, { recursive: true });
    await removeRawMascotFiles();

    const buffer = Buffer.from(await file.arrayBuffer());

    let targetExt = "png";
    let targetBuffer = buffer;

    if (isSvg) {
      targetExt = "svg";
      targetBuffer = buffer;
    } else {
      // Pertahankan PNG transparan atau konversi via sharp
      try {
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default || sharpModule;
        targetBuffer = await sharp(buffer).png().toBuffer();
        targetExt = "png";
      } catch {
        targetExt = isPng ? "png" : isWebp ? "webp" : "jpg";
      }
    }

    const targetPath = path.join(BRAND_DIR, `mascot.${targetExt}`);
    await fs.writeFile(targetPath, targetBuffer);

    await saveBrandConfig(
      {
        hasCustomMascot: true,
        mascotVersion: Date.now(),
      },
      updatedBy,
    );

    return { ok: true };
  } catch {
    return { ok: false, message: "Gagal menyimpan berkas maskot di server." };
  }
}

/**
 * Membaca berkas maskot kustom dari disk untuk disajikan oleh route `/api/mascot`.
 */
export async function readBrandMascotFile(): Promise<{ buffer: Buffer; contentType: string } | null> {
  const found = await findExistingMascotFile();
  if (!found) return null;

  try {
    const fullPath = path.join(BRAND_DIR, found.fileName);
    const buffer = await fs.readFile(fullPath);

    let contentType = "image/png";
    if (found.ext === "svg") contentType = "image/svg+xml";
    if (found.ext === "webp") contentType = "image/webp";

    return { buffer, contentType };
  } catch {
    return null;
  }
}

/**
 * Menghapus berkas fisik maskot di disk.
 */
async function removeRawMascotFiles(): Promise<void> {
  for (const ext of SUPPORTED_LOGO_EXTENSIONS) {
    try {
      await fs.unlink(path.join(BRAND_DIR, `mascot.${ext}`));
    } catch {}
  }
}

/**
 * Menghapus maskot kustom dan mengembalikan karakter maskot bawaan ("The 3D Treasurer").
 */
export async function deleteBrandMascotFile(updatedBy?: string): Promise<boolean> {
  try {
    await removeRawMascotFiles();
    await saveBrandConfig(
      {
        hasCustomMascot: false,
        mascotVersion: Date.now(),
      },
      updatedBy,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Mengatur ulang seluruh konfigurasi identitas brand kembali ke bawaan.
 */
export async function resetBrandConfig(): Promise<boolean> {
  try {
    await removeRawLogoFiles();
    await removeRawMascotFiles();
    await fs.mkdir(BRAND_DIR, { recursive: true });
    const freshConfig = {
      ...DEFAULT_BRAND_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy: "System Reset",
    };
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(freshConfig, null, 2),
      "utf-8",
    );
    memoryCachedConfig = freshConfig;
    return true;
  } catch {
    return false;
  }
}
