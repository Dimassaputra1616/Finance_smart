import { cx } from "@/components/ui/Card";

/**
 * Lambang "Rp" aplikasi. Warna dari token merek sidebar, jadi otomatis ikut
 * mode terang dan gelap tanpa varian `dark:`.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center rounded-xl bg-sidebar-brand-from font-mono font-bold text-sidebar-brand-foreground",
        className,
      )}
    >
      Rp
    </span>
  );
}
