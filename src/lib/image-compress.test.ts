import { describe, expect, it } from "vitest";
import {
  calculateScaledDimensions,
  formatFileSize,
  isHeicFile,
  isImageFile,
  optimizeLogoImage,
} from "./image-compress";

describe("formatFileSize", () => {
  it("memformat byte di bawah 1 KB", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("memformat kilobyte", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(200 * 1024)).toBe("200 KB");
  });

  it("memformat megabyte dengan satu desimal", () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0 MB");
  });
});

describe("isImageFile", () => {
  it("mengenali gambar dari MIME type", () => {
    const f1 = new File([], "struk.dat", { type: "image/jpeg" });
    const f2 = new File([], "struk.dat", { type: "image/png" });
    const f3 = new File([], "struk.dat", { type: "image/webp" });
    const f4 = new File([], "struk.dat", { type: "image/heic" });

    expect(isImageFile(f1)).toBe(true);
    expect(isImageFile(f2)).toBe(true);
    expect(isImageFile(f3)).toBe(true);
    expect(isImageFile(f4)).toBe(true);
  });

  it("mengenali gambar dari ekstensi nama berkas (termasuk huruf besar & HEIC)", () => {
    const f1 = new File([], "nota.heic", { type: "" });
    const f2 = new File([], "nota.HEIF", { type: "" });
    const f3 = new File([], "foto.JPG", { type: "" });
    const f4 = new File([], "kuitansi.png", { type: "application/octet-stream" });

    expect(isImageFile(f1)).toBe(true);
    expect(isImageFile(f2)).toBe(true);
    expect(isImageFile(f3)).toBe(true);
    expect(isImageFile(f4)).toBe(true);
  });

  it("menolak berkas non-gambar", () => {
    const f1 = new File([], "dokumen.pdf", { type: "application/pdf" });
    const f2 = new File([], "script.js", { type: "text/javascript" });
    const f3 = new File([], "data.csv", { type: "text/csv" });

    expect(isImageFile(f1)).toBe(false);
    expect(isImageFile(f2)).toBe(false);
    expect(isImageFile(f3)).toBe(false);
  });
});

describe("isHeicFile", () => {
  it("mengenali berkas HEIC/HEIF dari MIME type maupun ekstensi nama berkas", () => {
    const f1 = new File([], "IMG_8821.HEIC", { type: "" });
    const f2 = new File([], "IMG_8822.heif", { type: "" });
    const f3 = new File([], "foto.blob", { type: "image/heic" });
    const f4 = new File([], "foto.blob", { type: "image/heif" });

    expect(isHeicFile(f1)).toBe(true);
    expect(isHeicFile(f2)).toBe(true);
    expect(isHeicFile(f3)).toBe(true);
    expect(isHeicFile(f4)).toBe(true);
  });

  it("mengembalikan false untuk format gambar selain HEIC", () => {
    const f1 = new File([], "nota.jpg", { type: "image/jpeg" });
    const f2 = new File([], "nota.png", { type: "image/png" });
    const f3 = new File([], "nota.webp", { type: "image/webp" });

    expect(isHeicFile(f1)).toBe(false);
    expect(isHeicFile(f2)).toBe(false);
    expect(isHeicFile(f3)).toBe(false);
  });
});

describe("calculateScaledDimensions", () => {
  it("tidak mengubah ukuran jika kedua sisi di bawah maxDimension", () => {
    expect(calculateScaledDimensions(800, 600, 1600)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("menskalakan gambar landscape proporsional dengan lebar = maxDimension", () => {
    // 4000x2000 -> 1600x800
    expect(calculateScaledDimensions(4000, 2000, 1600)).toEqual({
      width: 1600,
      height: 800,
    });
  });

  it("menskalakan gambar portrait proporsional dengan tinggi = maxDimension", () => {
    // 2000x4000 -> 800x1600
    expect(calculateScaledDimensions(2000, 4000, 1600)).toEqual({
      width: 800,
      height: 1600,
    });
  });

  it("menskalakan gambar persegi", () => {
    expect(calculateScaledDimensions(3000, 3000, 1600)).toEqual({
      width: 1600,
      height: 1600,
    });
  });

  it("menangani nilai nol atau negatif secara aman", () => {
    expect(calculateScaledDimensions(0, 0, 1600)).toEqual({
      width: 1,
      height: 1,
    });
  });
});

describe("optimizeLogoImage", () => {
  it("mempertahankan berkas SVG apa adanya tanpa konversi raster", async () => {
    const svgFile = new File(["<svg></svg>"], "logo.svg", {
      type: "image/svg+xml",
    });
    const result = await optimizeLogoImage(svgFile);
    expect(result.name).toBe("logo.svg");
    expect(result.type).toBe("image/svg+xml");
  });

  it("mengabaikan berkas non-gambar", async () => {
    const textFile = new File(["teks"], "catatan.txt", {
      type: "text/plain",
    });
    const result = await optimizeLogoImage(textFile);
    expect(result.name).toBe("catatan.txt");
  });
});

