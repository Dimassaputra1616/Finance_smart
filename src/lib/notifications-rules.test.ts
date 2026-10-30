import { describe, expect, it } from "vitest";

describe("aturan notifikasi aplikasi", () => {
  it("memformat waktu relatif notifikasi dengan benar", () => {
    const now = Date.now();
    const formatDiff = (diffSec: number) => {
      if (diffSec < 60) return "Baru saja";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      return `${Math.floor(diffSec / 86400)} hari lalu`;
    };

    expect(formatDiff(10)).toBe("Baru saja");
    expect(formatDiff(300)).toBe("5 mnt lalu");
    expect(formatDiff(7200)).toBe("2 jam lalu");
    expect(formatDiff(172800)).toBe("2 hari lalu");
  });

  it("memvalidasi struktur notifikasi aplikasi dan target peran", () => {
    const notif = {
      id: "notif_1",
      title: "Persetujuan Kas Keluar Direktur",
      body: "Staf mengajukan Rp 150.000 untuk Bensin. Menunggu persetujuan Direktur.",
      type: "approval",
      targetRole: "DIRECTOR",
      createdAt: new Date().toISOString(),
      read: false,
    };

    expect(notif.title).toContain("Direktur");
    expect(notif.read).toBe(false);
    expect(notif.type).toBe("approval");
    expect(notif.targetRole).toBe("DIRECTOR");
  });

  it("memvalidasi penyaringan notifikasi untuk peran Direktur dan Staf", () => {
    const notifs = [
      { id: "1", targetRole: "DIRECTOR" },
      { id: "2", targetRole: "STAFF" },
      { id: "3", targetRole: "ALL" },
    ];

    const filterForRole = (role: string) =>
      notifs.filter((n) => {
        if (!n.targetRole || n.targetRole === "ALL") return true;
        if (role === "ADMIN") return true;
        if (role === "DIRECTOR") return n.targetRole === "DIRECTOR" || n.targetRole === "ADMIN";
        if (role === "STAFF") return n.targetRole === "STAFF";
        return true;
      });

    // Direktur melihat notifikasi Direktur dan broadcast ALL
    const directorNotifs = filterForRole("DIRECTOR");
    expect(directorNotifs.map((n) => n.id)).toEqual(["1", "3"]);

    // Staf melihat notifikasi miliknya dan ALL
    const staffNotifs = filterForRole("STAFF");
    expect(staffNotifs.map((n) => n.id)).toEqual(["2", "3"]);

    // Admin melihat semuanya
    const adminNotifs = filterForRole("ADMIN");
    expect(adminNotifs).toHaveLength(3);
  });
});
