"use client";

import { useMemo, useState } from "react";
import { UserAvatar } from "./UserAvatar";
import { ResetPasswordModalButton, ToggleUserStatusButton } from "./UserActions";
import {
  IconReceipt,
  IconSearch,
  IconShield,
  IconUser,
} from "@/components/Icons";
import { Card, CardHeader, EmptyState, Input, cx } from "@/components/ui";
import { USER_ROLE_LABELS } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import type { UserListItem } from "@/server/queries/users";
import type { SessionUser } from "@/lib/auth";

type RoleFilter = "ALL" | "ADMIN" | "DIRECTOR" | "STAFF";

export function UserListView({
  users,
  currentUser,
}: {
  users: UserListItem[];
  currentUser: SessionUser | null;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter Peran
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      // Filter Pencarian Teks
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = u.name.toLowerCase().includes(query);
        const matchUsername = u.username.toLowerCase().includes(query);
        const matchRole = (USER_ROLE_LABELS[u.role] || "").toLowerCase().includes(query);
        return matchName || matchUsername || matchRole;
      }

      return true;
    });
  }, [users, roleFilter, search]);

  const getRoleIcon = (role: string) => {
    if (role === "ADMIN") return <IconShield className="h-3 w-3" />;
    if (role === "DIRECTOR") return <IconReceipt className="h-3 w-3" />;
    return <IconUser className="h-3 w-3" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Daftar Pengguna Sistem"
        description={`${users.length} akun terdaftar di database`}
      />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Kontrol Pencarian & Filter Peran */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Input Pencarian Cepat */}
          <div className="relative flex-1 group">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors"
            >
              <IconSearch className="h-4 w-4" />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau peran…"
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          {/* Filter Tab Kapsul */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 rounded-xl border border-border bg-surface-muted/30 shrink-0">
            {(
              [
                { key: "ALL", label: "Semua" },
                { key: "ADMIN", label: "Admin" },
                { key: "DIRECTOR", label: "Direktur" },
                { key: "STAFF", label: "Staf" },
              ] as const
            ).map((tab) => {
              const isSelected = roleFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key)}
                  className={cx(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap",
                    isSelected
                      ? "bg-surface text-foreground shadow-2xs font-bold border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/60",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daftar Kartu Pengguna */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            compact
            title="Tidak ada pengguna ditemukan"
            description={
              search
                ? `Tidak ada akun yang cocok dengan kata kunci "${search}".`
                : "Belum ada akun pada filter peran ini."
            }
          />
        ) : (
          <ul className="divide-y divide-border/70 border border-border/80 rounded-2xl overflow-hidden bg-surface">
            {filteredUsers.map((user) => {
              const isSelf = currentUser?.id === user.id;

              return (
                <li
                  key={user.id}
                  className={cx(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-all duration-150 hover:bg-surface-hover/60",
                    !user.isActive && "opacity-60 bg-surface-muted/20",
                  )}
                >
                  {/* Sisi Kiri: Avatar & Info Pengguna */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <UserAvatar
                      userId={user.id}
                      name={user.name}
                      size="lg"
                      className="mt-0.5 shadow-xs shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Baris 1: Nama, Role Badge, Status Aktif */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">
                          {user.name}
                        </span>

                        {isSelf && (
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.2 text-[9px] font-bold text-primary">
                            Anda
                          </span>
                        )}

                        {/* Role Pill Badge */}
                        <span
                          className={cx(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono tracking-wide uppercase",
                            user.role === "ADMIN"
                              ? "bg-income-soft text-income border border-income/30"
                              : user.role === "DIRECTOR"
                                ? "bg-sidebar-brand-from/15 text-sidebar-brand-from border border-sidebar-brand-from/35 font-bold"
                                : "bg-surface-muted text-muted-foreground border border-border",
                          )}
                        >
                          {getRoleIcon(user.role)}
                          <span>{USER_ROLE_LABELS[user.role]}</span>
                        </span>

                        {/* Status Chip */}
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-income">
                            <span className="h-1.5 w-1.5 rounded-full bg-income animate-pulse" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="rounded-full bg-destructive-soft border border-destructive/30 px-2 py-0.2 text-[9px] font-bold text-destructive">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Username / Email */}
                      <p className="text-xs text-muted-foreground truncate font-mono">
                        {user.username}
                      </p>

                      {/* Baris 3: Aktivitas Terdaftar & Mutasi */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-subtle-foreground pt-0.5">
                        <span>Terdaftar: {formatDateShort(user.createdAt)}</span>
                        {user.createdCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-foreground">
                              {user.createdCount} mutasi
                            </span>
                          </>
                        )}
                        {user.approvedCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-foreground">
                              {user.approvedCount} approval
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Tombol Aksi */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                    <ResetPasswordModalButton id={user.id} name={user.name} />

                    <ToggleUserStatusButton
                      id={user.id}
                      name={user.name}
                      isActive={user.isActive}
                      isCurrentSessionUser={isSelf}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
