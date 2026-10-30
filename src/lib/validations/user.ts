import { z } from "zod";
import { isUserRole, type UserRole } from "@/lib/types";
import { nameSchema } from "./shared";

export const userRoleSchema = z
  .string({ required_error: "Peran pengguna wajib dipilih." })
  .refine(isUserRole, { message: "Peran pengguna tidak sah. Pilih Administrator atau Staf." })
  .transform((val) => val as UserRole);

export const emailSchema = z
  .string({ required_error: "Email atau nama login wajib diisi." })
  .trim()
  .min(3, "Email atau nama login minimal 3 karakter.")
  .max(100, "Email atau nama login maksimal 100 karakter.")
  .transform((val) => val.toLowerCase());

export const initialPasswordSchema = z
  .string({ required_error: "Kata sandi awal wajib diisi." })
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.");

export const createUserSchema = z.object({
  name: nameSchema("Nama lengkap", 60),
  email: emailSchema,
  role: userRoleSchema,
  password: initialPasswordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userIdSchema = z.object({
  id: z.string().min(1, "ID pengguna tidak valid."),
});

export const resetUserPasswordSchema = z.object({
  id: z.string().min(1, "ID pengguna tidak valid."),
  password: initialPasswordSchema,
});
