import { describe, expect, it } from "vitest";
import { createUserSchema, resetUserPasswordSchema } from "./user";

describe("createUserSchema", () => {
  it("menerima data pengguna yang valid", () => {
    const result = createUserSchema.safeParse({
      name: "Budi Santoso",
      email: "budi@kantor.com",
      role: "STAFF",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Budi Santoso");
      expect(result.data.email).toBe("budi@kantor.com");
      expect(result.data.role).toBe("STAFF");
    }
  });

  it("menolak peran tidak sah", () => {
    const result = createUserSchema.safeParse({
      name: "Budi",
      email: "budi@kantor.com",
      role: "SUPERMAN",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("menolak kata sandi kurang dari 8 karakter", () => {
    const result = createUserSchema.safeParse({
      name: "Budi",
      email: "budi@kantor.com",
      role: "STAFF",
      password: "pendek",
    });

    expect(result.success).toBe(false);
  });
});

describe("resetUserPasswordSchema", () => {
  it("menerima password baru minimal 8 karakter", () => {
    const result = resetUserPasswordSchema.safeParse({
      id: "user-123",
      password: "newPassword123",
    });

    expect(result.success).toBe(true);
  });
});
