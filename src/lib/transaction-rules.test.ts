import { describe, expect, it } from "vitest";
import {
  canApproveTransaction,
  canManageMasterData,
  canModifyTransaction,
  isTransactionAffectingBalance,
} from "./transaction-rules";

describe("canManageMasterData", () => {
  it("hanya ADMIN yang boleh mengubah akun, kategori, transfer, dan piutang", () => {
    expect(canManageMasterData("ADMIN")).toBe(true);
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
  it("hanya role ADMIN yang berhak menyetujui/menolak", () => {
    expect(canApproveTransaction("ADMIN")).toBe(true);
    expect(canApproveTransaction("STAFF")).toBe(false);
    expect(canApproveTransaction("ANONYMOUS")).toBe(false);
  });
});
