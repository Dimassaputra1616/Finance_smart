import { describe, expect, it } from "vitest";
import {
  setPendingProof,
  consumePendingProof,
} from "./proof-transfer";

describe("proof-transfer", () => {
  it("dapat menyimpan dan mengambil file bukti dari memori", () => {
    const dummyFile = new File(["dummy content"], "nota.webp", {
      type: "image/webp",
    });

    setPendingProof(dummyFile, {
      originalSize: 1000,
      compressedSize: 500,
    });

    const consumed = consumePendingProof();
    expect(consumed).not.toBeNull();
    expect(consumed?.file.name).toBe("nota.webp");
    expect(consumed?.meta?.originalSize).toBe(1000);

    // Setelah di-consume, memori harus kosong
    expect(consumePendingProof()).toBeNull();
  });
});
