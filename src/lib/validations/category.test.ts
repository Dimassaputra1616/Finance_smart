import { describe, expect, it } from "vitest";
import { categoryFormSchema } from "./category";

const base = { name: "Operasional", kind: "EXPENSE", color: "#22c55e" };

describe("categoryFormSchema — pagu bulanan", () => {
  it("kosong berarti tanpa pagu", () => {
    const result = categoryFormSchema.safeParse({ ...base, monthlyBudget: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.monthlyBudget).toBeNull();
  });

  it("spasi saja dianggap kosong", () => {
    const result = categoryFormSchema.safeParse({ ...base, monthlyBudget: "   " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.monthlyBudget).toBeNull();
  });

  it("membersihkan pemisah ribuan", () => {
    const result = categoryFormSchema.safeParse({
      ...base,
      monthlyBudget: "5.000.000",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.monthlyBudget).toBe(5_000_000);
  });

  it("menerima tepat di batas Int 32-bit", () => {
    const result = categoryFormSchema.safeParse({
      ...base,
      monthlyBudget: "2147483647",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.monthlyBudget).toBe(2_147_483_647);
  });

  it("menolak nol", () => {
    const result = categoryFormSchema.safeParse({ ...base, monthlyBudget: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.monthlyBudget?.[0]).toContain(
        "positif",
      );
    }
  });

  it("menolak nominal di atas batas Int 32-bit", () => {
    const result = categoryFormSchema.safeParse({
      ...base,
      monthlyBudget: "2147483648",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.monthlyBudget).toBeDefined();
    }
  });
});
