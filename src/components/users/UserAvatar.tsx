"use client";

import { useState } from "react";
import { cx } from "@/components/ui/Card";

export type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<UserAvatarSize, { container: string; text: string }> = {
  sm: { container: "h-7 w-7 rounded-lg", text: "text-xs" },
  md: { container: "h-9 w-9 rounded-xl", text: "text-sm" },
  lg: { container: "h-11 w-11 rounded-2xl", text: "text-base" },
  xl: { container: "h-20 w-20 rounded-3xl", text: "text-2xl" },
};

/**
 * Cache memori untuk mencatat userId yang tidak memiliki foto avatar.
 * Mencegah browser berulang kali memanggil network request 404 pada setiap navigasi halaman.
 */
const avatarNotFoundSet = new Set<string>();

/**
 * Komponen Foto Profil Pengguna (User Avatar).
 *
 * Menampilkan foto profil asli jika sudah diunggah.
 * Jika belum ada foto, otomatis menampilkan inisial elegan dengan gradien moneter.
 * Tanpa status dot (sesuai preferensi pengguna).
 */
export function UserAvatar({
  userId,
  name,
  size = "md",
  className,
}: {
  userId: string;
  name: string;
  size?: UserAvatarSize;
  className?: string;
}) {
  const [hasImage, setHasImage] = useState(() => !avatarNotFoundSet.has(userId));
  const { container, text } = SIZE_MAP[size];
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  const handleError = () => {
    avatarNotFoundSet.add(userId);
    setHasImage(false);
  };

  return (
    <div
      className={cx(
        "relative grid shrink-0 place-items-center overflow-hidden border border-sidebar-border/80 bg-linear-to-br from-sidebar-brand-from to-sidebar-brand-to text-sidebar-brand-foreground font-bold font-mono shadow-xs select-none",
        container,
        className,
      )}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/avatar/${encodeURIComponent(userId)}`}
          alt={name}
          onError={handleError}
          className="h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <span className={text}>{initial}</span>
      )}
    </div>
  );
}
