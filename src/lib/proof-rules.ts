/**
 * Aturan murni untuk berkas bukti nota yang diunggah.
 *
 * Sebelumnya server menyimpan berkas apa adanya, dengan ekstensi yang diambil
 * dari NAMA FILE kiriman pengguna. Berkas `.html` atau `.svg` berisi skrip yang
 * dibuka admin dari origin yang sama dengan aplikasi bisa membaca sesi admin.
 * Karena itu jenis berkas ditentukan dari ISI (magic bytes), bukan dari nama
 * atau header `Content-Type` yang bisa dipalsukan, dan ekstensi yang disimpan
 * diturunkan dari jenis itu.
 *
 * Murni, tanpa akses disk (AGENTS.md §5), supaya bisa diuji langsung.
 */

/** Batas ukuran bukti. Foto nota hasil kompresi klien biasanya ~200 KB. */
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export type ProofType = "webp" | "jpeg" | "png" | "heic";

const EXTENSIONS: Record<ProofType, string> = {
  webp: "webp",
  jpeg: "jpg",
  png: "png",
  heic: "heic",
};

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
};

function hasBytes(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "mif1", "msf1"];

/** Mengenali berkas foto HEIC/HEIF (kamera iPhone) dari box ISOBMFF 'ftyp'. */
export function isHeicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  // Box type harus 'ftyp' di offset 4 ('f' 't' 'y' 'p' = 0x66 0x74 0x79 0x70)
  if (!hasBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return false;

  // Cek major brand di offset 8
  const majorBrand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
  if (HEIC_BRANDS.includes(majorBrand)) return true;

  // Cek compatible brands dari offset 16 (maksimal 64 byte awal)
  const maxOffset = Math.min(bytes.length, 64);
  for (let offset = 16; offset + 4 <= maxOffset; offset += 4) {
    const brand = String.fromCharCode(...bytes.slice(offset, offset + 4)).toLowerCase();
    if (HEIC_BRANDS.includes(brand)) return true;
  }

  return false;
}

/** Mengenali JPEG, PNG, WebP, dan HEIC dari byte awalnya. Selain itu `null`. */
export function detectProofType(bytes: Uint8Array): ProofType | null {
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // WebP: "RIFF" + 4 byte ukuran + "WEBP".
  if (
    hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  if (isHeicBytes(bytes)) return "heic";
  return null;
}

export type ProofCheck =
  | { ok: true; type: ProofType; extension: string }
  | { ok: false; message: string };

/** Periksa isi berkas: tidak kosong, tidak terlalu besar, dan benar-benar gambar. */
export function checkProofFile(bytes: Uint8Array): ProofCheck {
  if (bytes.length === 0) {
    return { ok: false, message: "Berkas bukti kosong." };
  }

  if (bytes.length > MAX_PROOF_BYTES) {
    return { ok: false, message: "Ukuran bukti maksimal 5 MB." };
  }

  const type = detectProofType(bytes);
  if (!type) {
    return {
      ok: false,
      message: "Bukti harus berupa gambar JPEG, PNG, WebP, atau HEIC.",
    };
  }

  return { ok: true, type, extension: EXTENSIONS[type] };
}

// Nama berkas yang dibuat server: proof_<epoch ms>_<acak>.<ekstensi>.
// Pola ketat inilah yang mencegah path traversal saat berkas dibaca kembali.
const SAFE_NAME = /^proof_\d{10,16}_[a-z0-9]{6,16}\.(webp|jpg|png|heic)$/;

export function isSafeProofFileName(name: string): boolean {
  return SAFE_NAME.test(name);
}

/** `Content-Type` untuk nama berkas yang sah, atau `null` bila nama tidak valid. */
export function proofContentType(name: string): string | null {
  if (!isSafeProofFileName(name)) return null;
  const extension = name.slice(name.lastIndexOf(".") + 1);
  return CONTENT_TYPES[extension] ?? null;
}

/**
 * Nama asli berkas dari pengguna, dibersihkan sebelum disimpan sebagai
 * metadata: hanya nama dasarnya, tanpa karakter kontrol, maksimal 120 karakter.
 */
export function sanitizeOriginalName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = Array.from(base)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code > 0x1f && code !== 0x7f;
    })
    .join("")
    .trim();

  return cleaned.slice(0, 120) || "bukti";
}
