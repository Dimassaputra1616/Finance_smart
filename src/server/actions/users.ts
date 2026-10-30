"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { superAdminGuard, getCurrentUser } from "@/lib/session";
import { hashPassword } from "@/lib/auth-passwords";
import { canDeactivateUser } from "@/lib/user-rules";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/types";
import {
  createUserSchema,
  resetUserPasswordSchema,
  userIdSchema,
} from "@/lib/validations";
import {
  actionError,
  describePrismaError,
  type ActionResult,
} from "@/lib/types";

function readCreateUserForm(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  };
}

/**
 * Tambah pengguna baru ke sistem (Khusus Super Admin).
 */
export async function createUser(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await superAdminGuard();
  if (denied) return denied;

  const parsed = createUserSchema.safeParse(readCreateUserForm(formData));

  if (!parsed.success) {
    return actionError(
      "Periksa kembali isian formulir pengguna.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { name, email, role, password } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (!userDelegate) {
      return actionError("Fitur pengguna belum tersedia di database.");
    }

    // Cek duplikasi email / username
    const existing = await userDelegate.findUnique({
      where: { username: email },
    });

    if (existing) {
      return actionError("Email atau nama pengguna ini sudah terdaftar. Gunakan email lain.", {
        email: ["Email sudah digunakan oleh akun lain."],
      });
    }

    const passwordHash = hashPassword(password);

    await userDelegate.create({
      data: {
        name,
        username: email,
        passwordHash,
        role,
        isActive: true,
      },
    });

    revalidatePath("/pengguna");
    const roleLabel = USER_ROLE_LABELS[role as UserRole] ?? role;
    return { ok: true, message: `Pengguna "${name}" berhasil ditambahkan sebagai ${roleLabel}.` };
  } catch (error) {
    return actionError(describePrismaError(error));
  }
}

/**
 * Mengaktifkan atau menonaktifkan akun pengguna (Khusus Super Admin).
 */
export async function toggleUserStatus(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await superAdminGuard();
  if (denied) return denied;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return actionError("Sesi Anda tidak valid.");
  }

  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return actionError("ID Pengguna tidak valid.");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (!userDelegate) return actionError("Database belum siap.");

    const targetUser = await userDelegate.findUnique({
      where: { id: parsed.data.id },
    });

    if (!targetUser) {
      return actionError("Pengguna tidak ditemukan.");
    }

    // Jika ingin menonaktifkan, terapkan aturan bisnis keamanan
    if (targetUser.isActive) {
      const activeAdminCount = await userDelegate.count({
        where: { role: "ADMIN", isActive: true },
      });

      const check = canDeactivateUser({
        targetUserId: targetUser.id,
        currentUserId: currentUser.id,
        targetUserRole: targetUser.role,
        activeAdminCount,
      });

      if (!check.allowed) {
        return actionError(check.reason ?? "Tidak dapat menonaktifkan pengguna ini.");
      }
    }

    const nextState = !targetUser.isActive;
    await userDelegate.update({
      where: { id: targetUser.id },
      data: { isActive: nextState },
    });

    revalidatePath("/pengguna");
    return {
      ok: true,
      message: `Status akun "${targetUser.name}" berhasil diubah menjadi ${nextState ? "Aktif" : "Nonaktif"}.`,
    };
  } catch (error) {
    return actionError(describePrismaError(error));
  }
}

/**
 * Setel ulang kata sandi pengguna oleh Super Admin.
 */
export async function resetUserPassword(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await superAdminGuard();
  if (denied) return denied;

  const parsed = resetUserPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError(
      "Kata sandi baru minimal 8 karakter.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { id, password } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (!userDelegate) return actionError("Database belum siap.");

    const user = await userDelegate.findUnique({ where: { id } });
    if (!user) return actionError("Pengguna tidak ditemukan.");

    const passwordHash = hashPassword(password);

    await userDelegate.update({
      where: { id },
      data: { passwordHash },
    });

    revalidatePath("/pengguna");
    return { ok: true, message: `Kata sandi untuk "${user.name}" berhasil diperbarui.` };
  } catch (error) {
    return actionError(describePrismaError(error));
  }
}
