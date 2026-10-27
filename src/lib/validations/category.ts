import { z } from "zod";
import {
  hexColorSchema,
  kindSchema,
  nameSchema,
  optionalAmountSchema,
} from "./shared";

export const categoryFormSchema = z.object({
  name: nameSchema("Nama kategori", 50),
  kind: kindSchema,
  color: hexColorSchema,
  /** Pagu bulanan dalam rupiah. `null` = tanpa pagu. Hanya untuk pengeluaran. */
  monthlyBudget: optionalAmountSchema,
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const categoryIdSchema = z.object({
  categoryId: z.string().min(1, "ID kategori tidak valid."),
});