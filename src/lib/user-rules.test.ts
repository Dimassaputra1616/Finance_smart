import { describe, expect, it } from "vitest";
import { canDeactivateUser } from "./user-rules";

describe("canDeactivateUser", () => {
  it("menolak menonaktifkan akun sendiri", () => {
    const result = canDeactivateUser({
      targetUserId: "user-1",
      currentUserId: "user-1",
      targetUserRole: "ADMIN",
      activeAdminCount: 2,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("akun Anda sendiri");
  });

  it("menolak menonaktifkan jika satu-satunya admin", () => {
    const result = canDeactivateUser({
      targetUserId: "user-2",
      currentUserId: "user-1",
      targetUserRole: "ADMIN",
      activeAdminCount: 1,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Administrator terakhir");
  });

  it("mengizinkan menonaktifkan staf", () => {
    const result = canDeactivateUser({
      targetUserId: "user-staff",
      currentUserId: "user-admin",
      targetUserRole: "STAFF",
      activeAdminCount: 1,
    });

    expect(result.allowed).toBe(true);
  });

  it("mengizinkan menonaktifkan admin lain bila masih ada admin aktif tersisa", () => {
    const result = canDeactivateUser({
      targetUserId: "user-admin-2",
      currentUserId: "user-admin-1",
      targetUserRole: "ADMIN",
      activeAdminCount: 2,
    });

    expect(result.allowed).toBe(true);
  });
});
