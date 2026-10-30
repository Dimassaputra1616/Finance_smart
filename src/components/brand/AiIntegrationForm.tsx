"use client";

import { useActionState, useState } from "react";
import { updateAiIntegration } from "@/server/actions/brand";
import { IconCheck, IconEye, IconEyeOff, IconSparkle, IconRotate } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input } from "@/components/ui";
import { DEFAULT_BRAND_CONFIG, type BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Integrasi AI Vision (Mendukung 9router, Custom Gateway, atau Direct Anthropic).
 */
export function AiIntegrationForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateAiIntegration, INITIAL_RESULT);

  const [baseUrl, setBaseUrl] = useState(
    brand.aiBaseUrl || DEFAULT_BRAND_CONFIG.aiBaseUrl || "https://api.anthropic.com",
  );
  const [modelName, setModelName] = useState(
    brand.aiModelName || DEFAULT_BRAND_CONFIG.aiModelName || "claude-3-5-haiku-20241022",
  );
  const [apiKey, setApiKey] = useState(brand.anthropicApiKey || "");
  const [showKey, setShowKey] = useState(false);

  const isConfigured = Boolean(
    brand.anthropicApiKey ||
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_HAS_AI_KEY),
  );

  const activeMessage = result.message;
  const isSuccess = result.ok;

  const handleResetDefaults = () => {
    setBaseUrl("https://api.anthropic.com");
    setModelName("claude-3-5-haiku-20241022");
  };

  return (
    <form action={formAction} className="space-y-6">
      {activeMessage ? (
        <Alert
          key={activeMessage}
          tone={isSuccess ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {activeMessage}
        </Alert>
      ) : null}

      <div className="space-y-5">
        {/* Banner Penjelasan Mesin AI */}
        <div className="rounded-2xl border border-border/80 bg-linear-to-br from-surface to-surface-muted/30 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <IconSparkle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Pemindai Struk Cerdas: AI Vision (Anthropic Protocol)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mendukung <strong>9router</strong>, gateway custom, atau koneksi langsung Anthropic.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-income/30 bg-income-soft/40 px-2.5 py-0.5 text-[11px] font-semibold text-income self-start sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-income animate-pulse" />
              <span>{isConfigured ? "Kunci Aktif" : "Kunci Terpasang di .env"}</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            AI Vision secara cerdas membaca foto nota atau kuitansi yang difoto staf,
            mendeteksi <strong>Nominal Total</strong>, <strong>Tanggal Pembelian</strong>,{" "}
            <strong>Nama Toko / Keterangan</strong>, serta memprediksi <strong>Pos Anggaran</strong>{" "}
            yang paling cocok secara otomatis.
          </p>
        </div>

        {/* Konfigurasi Endpoint 9router / Custom Gateway */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Pengaturan Endpoint &amp; Model
            </h4>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <IconRotate className="h-3.5 w-3.5" />
              <span>Setel Ulang Default</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Input Base URL Router */}
            <div className="sm:col-span-2">
              <FormField
                label="Base URL Endpoint (9router / API Gateway)"
                htmlFor="aiBaseUrl"
                name="aiBaseUrl"
                hint="Alamat router API abang dengan protokol Anthropic (/v1/messages). Default: https://api.anthropic.com"
              >
                <Input
                  id="aiBaseUrl"
                  name="aiBaseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.9router.com atau domain gateway abang"
                  className="font-mono text-xs"
                />
              </FormField>
            </div>

            {/* Input Nama Model */}
            <div className="sm:col-span-2">
              <FormField
                label="Nama Model AI Vision"
                htmlFor="aiModelName"
                name="aiModelName"
                hint="Nama model yang dipanggil di router (Rekomendasi: claude-3-5-haiku-20241022 untuk kecepatan tinggi ~1 detik)"
              >
                <Input
                  id="aiModelName"
                  name="aiModelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="claude-3-5-haiku-20241022"
                  className="font-mono text-xs"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Input Kunci API */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <FormField
            label="Kunci API (Token 9router / Anthropic Key)"
            htmlFor="anthropicApiKey"
            name="anthropicApiKey"
            hint="Token autentikasi router atau akun Anthropic. (Juga dapat disetel di .env sebagai ANTHROPIC_API_KEY)"
          >
            <div className="relative">
              <Input
                id="anthropicApiKey"
                type={showKey ? "text" : "password"}
                name="anthropicApiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-... atau token router abang"
                className="font-mono text-xs pr-11"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Sembunyikan kunci API" : "Tampilkan kunci API"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                {showKey ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border/80 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="gap-2 min-h-11 cursor-pointer px-5"
        >
          <IconCheck className="h-4 w-4" />
          <span>{pending ? "Menyimpan Konfigurasi..." : "Simpan Konfigurasi 9router & AI"}</span>
        </Button>
      </div>
    </form>
  );
}
