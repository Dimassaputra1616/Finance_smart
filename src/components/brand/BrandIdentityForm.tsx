"use client";

import { useActionState, useState } from "react";
import { updateBrandIdentity, resetBrandToDefault } from "@/server/actions/brand";
import { IconCheck, IconRotate } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input, Select } from "@/components/ui";
import {
  LOGO_SHAPES,
  LOGO_SHAPE_LABELS,
  type BrandConfig,
  type LogoShape,
} from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Master Identitas Brand & Penamaan Aplikasi.
 */
export function BrandIdentityForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateBrandIdentity, INITIAL_RESULT);
  const [resetResult, setResetResult] = useState<ActionResult | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [appName, setAppName] = useState(brand.appName);
  const [appTagline, setAppTagline] = useState(brand.appTagline);
  const [shortName, setShortName] = useState(brand.shortName);
  const [logoShape, setLogoShape] = useState<LogoShape>(brand.logoShape ?? "rounded");

  const handleReset = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mengatur ulang seluruh identitas brand dan logo kembali ke setelan awal sistem?",
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetBrandToDefault();
      setResetResult(res);
      if (res.ok) {
        setAppName("Perbendaharaan & Kas");
        setAppTagline("Sistem pengendalian keuangan internal");
        setShortName("Keuangan");
        setLogoShape("rounded");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const activeMessage = result.message || resetResult?.message;
  const isSuccess = result.ok || resetResult?.ok;

  return (
    <form action={formAction} className="space-y-5">
      {activeMessage ? (
        <Alert
          key={activeMessage}
          tone={isSuccess ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {activeMessage}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nama Aplikasi / Brand */}
        <div className="sm:col-span-2">
          <FormField
            label="Nama Aplikasi / Brand Perusahaan"
            htmlFor="appName"
            name="appName"
            required
            hint="Tampil di bilah samping, header ponsel, tab peramban, dan halaman masuk."
          >
            <Input
              id="appName"
              name="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Contoh: PT Sinar Keuangan Abadi"
              required
              minLength={2}
              maxLength={50}
              className="font-medium"
            />
          </FormField>
        </div>

        {/* Slogan / Tagline */}
        <div className="sm:col-span-2">
          <FormField
            label="Slogan / Tagline Aplikasi"
            htmlFor="appTagline"
            name="appTagline"
            hint="Keterangan singkat di bawah nama aplikasi pada bilah samping dan panel masuk."
          >
            <Input
              id="appTagline"
              name="appTagline"
              value={appTagline}
              onChange={(e) => setAppTagline(e.target.value)}
              placeholder="Contoh: Sistem Pengendalian Keuangan & Buku Kas Internal"
              maxLength={100}
            />
          </FormField>
        </div>

        {/* Nama Ringkas PWA */}
        <div>
          <FormField
            label="Nama Singkat (Ikon Homescreen HP)"
            htmlFor="shortName"
            name="shortName"
            required
            hint="Maksimal 16 karakter. Ditampilkan di bawah ikon aplikasi pada layar utama ponsel."
          >
            <Input
              id="shortName"
              name="shortName"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Contoh: Kas Kantor"
              required
              minLength={2}
              maxLength={16}
            />
          </FormField>
        </div>

        {/* Bentuk Kontainer Logo */}
        <div>
          <FormField
            label="Bentuk Tampilan Logo"
            htmlFor="logoShape"
            name="logoShape"
            hint="Pilihan bentuk sudut bingkai logo pada bilah samping dan navigasi."
          >
            <Select
              id="logoShape"
              name="logoShape"
              value={logoShape}
              onChange={(e) => setLogoShape(e.target.value as LogoShape)}
            >
              {LOGO_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {LOGO_SHAPE_LABELS[shape]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      {/* Informasi Pembaruan Terakhir */}
      {brand.updatedAt && (
        <p className="text-[11px] text-subtle-foreground">
          Terakhir diperbarui: {new Date(brand.updatedAt).toLocaleString("id-ID")}{" "}
          {brand.updatedBy ? `oleh ${brand.updatedBy}` : ""}
        </p>
      )}

      {/* Tombol Simpan & Tombol Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || isResetting}
          onClick={handleReset}
          className="gap-1.5 text-xs text-muted-foreground hover:text-destructive min-h-11 cursor-pointer"
        >
          <IconRotate className="h-3.5 w-3.5" />
          <span>Reset ke Bawaan Sistem</span>
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={pending || isResetting}
          className="gap-2 min-h-11 cursor-pointer px-5"
        >
          <IconCheck className="h-4 w-4" />
          <span>{pending ? "Menyimpan..." : "Simpan Identitas Brand"}</span>
        </Button>
      </div>
    </form>
  );
}
