import { describe, expect, it } from "vitest";
import {
  canAccessConfigMaster,
  canApproveTransaction,
  canManageMasterData,
  canManageUsers,
  canModifyTransaction,
  isTransactionAffectingBalance,
} from "./transaction-rules";

describe("canManageMasterData", () => {
  it("ADMIN dan DIRECTOR boleh mengubah akun, kategori, transfer, dan piutang", () => {
    expect(canManageMasterData("ADMIN")).toBe(true);
    expect(canManageMasterData("DIRECTOR")).toBe(true);
  });

  it("menolak STAFF", () => {
    expect(canManageMasterData("STAFF")).toBe(false);
  });

  it("menolak peran kosong atau tidak dikenal", () => {
    expect(canManageMasterData(null)).toBe(false);
    expect(canManageMasterData(undefined)).toBe(false);
    expect(canManageMasterData("")).toBe(false);
    expect(canManageMasterData("admin")).toBe(false);
    expect(canManageMasterData("SUPERUSER")).toBe(false);
  });
});

describe("canManageUsers", () => {
  it("hanya ADMIN (Super Admin) yang boleh mengelola akun pengguna", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("DIRECTOR")).toBe(false);
    expect(canManageUsers("STAFF")).toBe(false);
  });
});

describe("canAccessConfigMaster", () => {
  it("eksklusif hanya ADMIN (Super Admin) yang boleh mengakses dan mengubah Config Master", () => {
    expect(canAccessConfigMaster("ADMIN")).toBe(true);
    expect(canAccessConfigMaster("DIRECTOR")).toBe(false);
    expect(canAccessConfigMaster("STAFF")).toBe(false);
    expect(canAccessConfigMaster(null)).toBe(false);
    expect(canAccessConfigMaster(undefined)).toBe(false);
  });
});

describe("isTransactionAffectingBalance", () => {
  it("hanya transaksi APPROVED yang mempengaruhi saldo kas", () => {
    expect(isTransactionAffectingBalance("APPROVED")).toBe(true);
    expect(isTransactionAffectingBalance("PENDING")).toBe(false);
    expect(isTransactionAffectingBalance("REJECTED")).toBe(false);
    expect(isTransactionAffectingBalance(null)).toBe(false);
    expect(isTransactionAffectingBalance(undefined)).toBe(false);
  });
});

describe("canModifyTransaction", () => {
  const admin = { id: "user-admin", role: "ADMIN" as const };
  const director = { id: "user-director", role: "DIRECTOR" as const };
  const staffA = { id: "user-staff-a", role: "STAFF" as const };
  const staffB = { id: "user-staff-b", role: "STAFF" as const };

  it("admin bebas mengubah transaksi status apa pun dan milik siapa pun", () => {
    expect(
      canModifyTransaction(admin, {
        createdById: staffA.id,
        status: "APPROVED",
      }).allowed,
    ).toBe(true);
    expect(
      canModifyTransaction(admin, {
        createdById: staffA.id,
        status: "PENDING",
      }).allowed,
    ).toBe(true);
    expect(
      canModifyTransaction(admin, {
        createdById: null,
        status: "REJECTED",
      }).allowed,
    ).toBe(true);
  });

  it("director bebas mengubah transaksi status apa pun dan milik siapa pun", () => {
    expect(
      canModifyTransaction(director, {
        createdById: staffA.id,
        status: "APPROVED",
      }).allowed,
    ).toBe(true);
    expect(
      canModifyTransaction(director, {
        createdById: staffA.id,
        status: "PENDING",
      }).allowed,
    ).toBe(true);
  });

  it("staf boleh mengubah transaksi miliknya sendiri yang masih PENDING", () => {
    const res = canModifyTransaction(staffA, {
      createdById: staffA.id,
      status: "PENDING",
    });
    expect(res.allowed).toBe(true);
  });

  it("staf DITOLAK jika mencoba mengubah transaksi milik staf lain", () => {
    const res = canModifyTransaction(staffA, {
      createdById: staffB.id,
      status: "PENDING",
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("dicatat sendiri");
  });

  it("staf DITOLAK jika mencoba mengubah transaksi yang sudah APPROVED", () => {
    const res = canModifyTransaction(staffA, {
      createdById: staffA.id,
      status: "APPROVED",
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("sudah disetujui");
  });

  it("staf DITOLAK jika mencoba mengubah transaksi yang sudah REJECTED", () => {
    const res = canModifyTransaction(staffA, {
      createdById: staffA.id,
      status: "REJECTED",
    });
    expect(res.allowed).toBe(false);
  });
});

describe("canApproveTransaction", () => {
  it("ADMIN dan DIRECTOR berhak menyetujui/menolak transaksi", () => {
    expect(canApproveTransaction("ADMIN")).toBe(true);
    expect(canApproveTransaction("DIRECTOR")).toBe(true);
    expect(canApproveTransaction("STAFF")).toBe(false);
    expect(canApproveTransaction("ANONYMOUS")).toBe(false);
  });
});
