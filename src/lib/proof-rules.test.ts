import { describe, expect, it } from "vitest";
import {
  MAX_PROOF_BYTES,
  checkProofFile,
  detectProofType,
  isSafeProofFileName,
  proofContentType,
  sanitizeOriginalName,
} from "./proof-rules";

const bytes = (...values: number[]) => new Uint8Array(values);

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const WEBP = bytes(
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
);
const textBytes = (text: string) => new TextEncoder().encode(text);

describe("detectProofType", () => {
  it("mengenali JPEG, PNG, dan WebP dari isinya", () => {
    expect(detectProofType(JPEG)).toBe("jpeg");
    expect(detectProofType(PNG)).toBe("png");
    expect(detectProofType(WEBP)).toBe("webp");
  });

  it("menolak HTML dan SVG walau berisi skrip", () => {
    expect(detectProofType(textBytes("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectProofType(textBytes("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(detectProofType(textBytes("<?xml version='1.0'?><svg/>"))).toBeNull();
  });

  it("menolak RIFF yang bukan WebP (misalnya WAV)", () => {
    const wav = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);
    expect(detectProofType(wav)).toBeNull();
  });

  it("tidak error pada berkas lebih pendek dari tanda pengenalnya", () => {
    expect(detectProofType(bytes())).toBeNull();
    expect(detectProofType(bytes(0xff, 0xd8))).toBeNull();
    expect(detectProofType(bytes(0x52, 0x49, 0x46, 0x46))).toBeNull();
  });
});

describe("checkProofFile", () => {
  it("menerima gambar yang sah dan menurunkan ekstensi dari isinya", () => {
    expect(checkProofFile(JPEG)).toEqual({ ok: true, type: "jpeg", extension: "jpg" });
    expect(checkProofFile(PNG)).toEqual({ ok: true, type: "png", extension: "png" });
    expect(checkProofFile(WEBP)).toEqual({ ok: true, type: "webp", extension: "webp" });
  });

  it("menolak berkas kosong", () => {
    const res = checkProofFile(bytes());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("kosong");
  });

  it("menolak yang bukan gambar", () => {
    const res = checkProofFile(textBytes("<script>alert(1)</script>"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("JPEG, PNG, atau WebP");
  });

  it("menerima tepat di batas ukuran dan menolak 1 byte di atasnya", () => {
    const atLimit = new Uint8Array(MAX_PROOF_BYTES);
    atLimit.set(JPEG);
    expect(checkProofFile(atLimit).ok).toBe(true);

    const overLimit = new Uint8Array(MAX_PROOF_BYTES + 1);
    overLimit.set(JPEG);
    const res = checkProofFile(overLimit);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("5 MB");
  });
});

describe("isSafeProofFileName", () => {
  it("menerima nama yang dibuat server", () => {
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.jpg")).toBe(true);
    expect(isSafeProofFileName("proof_1793017003886_52njjv.webp")).toBe(true);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.png")).toBe(true);
  });

  it("menolak path traversal dan pemisah direktori", () => {
    expect(isSafeProofFileName("../etc/passwd")).toBe(false);
    expect(isSafeProofFileName("..%2f..%2fetc%2fpasswd")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.webp/../x")).toBe(false);
    expect(isSafeProofFileName("a/proof_1793017003886_a1b2c3d4e5f6.webp")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.webp\\x")).toBe(false);
  });

  it("menolak ekstensi berbahaya dan huruf besar", () => {
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.svg")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.html")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_A1B2C3D4E5F6.webp")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.WEBP")).toBe(false);
  });

  it("menolak nama yang bukan pola server", () => {
    expect(isSafeProofFileName("")).toBe(false);
    expect(isSafeProofFileName("nota.webp")).toBe(false);
    expect(isSafeProofFileName("proof_1_a.webp")).toBe(false);
    expect(isSafeProofFileName("proof_1793017003886_a1b2c3d4e5f6.webp\0.html")).toBe(false);
  });
});

describe("proofContentType", () => {
  it("memetakan ekstensi ke Content-Type gambar", () => {
    expect(proofContentType("proof_1793017003886_a1b2c3d4e5f6.webp")).toBe("image/webp");
    expect(proofContentType("proof_1793017003886_a1b2c3d4e5f6.jpg")).toBe("image/jpeg");
    expect(proofContentType("proof_1793017003886_a1b2c3d4e5f6.png")).toBe("image/png");
  });

  it("mengembalikan null untuk nama yang tidak sah", () => {
    expect(proofContentType("../x.png")).toBeNull();
    expect(proofContentType("proof_1793017003886_a1b2c3d4e5f6.svg")).toBeNull();
  });
});

describe("sanitizeOriginalName", () => {
  it("hanya menyisakan nama dasar tanpa direktori", () => {
    expect(sanitizeOriginalName("C:\\Users\\dimas\\nota.jpg")).toBe("nota.jpg");
    expect(sanitizeOriginalName("../../etc/passwd")).toBe("passwd");
  });

  it("membuang karakter kontrol", () => {
    expect(sanitizeOriginalName("no\u0000ta\n.jpg")).toBe("nota.jpg");
  });

  it("memotong nama yang terlalu panjang", () => {
    expect(sanitizeOriginalName("a".repeat(300) + ".jpg")).toHaveLength(120);
  });

  it("memakai nama cadangan bila hasilnya kosong", () => {
    expect(sanitizeOriginalName("")).toBe("bukti");
    expect(sanitizeOriginalName("   ")).toBe("bukti");
    expect(sanitizeOriginalName("a/")).toBe("bukti");
  });
});
