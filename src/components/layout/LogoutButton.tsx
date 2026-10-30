"use client";

import { logout } from "@/server/actions/auth";

/**
 * Tombol keluar sesi di sidebar.
 * Mendukung mode tombol penuh, mode kuncup, maupun mode ikon saja.
 */
export function LogoutButton({
  className,
  isCollapsed = false,
  iconOnly = false,
}: {
  className?: string;
  isCollapsed?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <form action={logout} className={iconOnly ? "shrink-0" : "w-full"}>
      <button
        type="submit"
        title="Keluar dari sesi"
        aria-label="Keluar dari sesi"
        className={
          className ??
          `flex w-full cursor-pointer items-center rounded-xl text-xs font-medium text-sidebar-muted transition-all duration-150 hover:bg-destructive-soft hover:text-destructive active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            isCollapsed
              ? "justify-center p-2.5 min-h-10"
              : "gap-2.5 px-3 py-2.5 min-h-10"
          }`
        }
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {!isCollapsed && !iconOnly && <span>Keluar dari Sesi</span>}
      </button>
    </form>
  );
}
