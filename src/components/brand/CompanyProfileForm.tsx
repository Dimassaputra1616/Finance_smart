"use client";

import { useActionState, useState } from "react";
import { updateCompanyProfile } from "@/server/actions/brand";
import { IconCheck } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Profil Entitas / Badan Usaha (untuk Kop Laporan, Kuitansi, dan Catatan Resmi).
 */
export function CompanyProfileForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateCompanyProfile, INITIAL_RESULT);

  const [companyName, setCompanyName] = useState(brand.companyName || "");
  const [companyAddress, setCompanyAddress] = useState(brand.companyAddress || "");
  const [companyPhone, setCompanyPhone] = useState(brand.companyPhone || "");
  const [companyEmail, setCompanyEmail] = useState(brand.companyEmail || "");

  const activeMessage = result.message;
  const isSuccess = result.ok;

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
        <div className="sm:col-span-2">
          <FormField
            label="Nama Resmi Badan Usaha / Organisasi"
            name="companyName"
            required
            hint="Nama resmi yang tercetak pada kop laporan keuangan, bukti pengeluaran, dan ekspor data."
          >
            <Input
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: PT Sinar Keuangan Mandiri / CV Berkah Abadi"
              required
              minLength={2}
              maxLength={100}
              className="font-medium"
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField
            label="Alamat Kantor / Domisili Usaha"
            name="companyAddress"
            hint="Alamat lengkap operasional kantor untuk kelengkapan administrasi perbendaharaan."
          >
            <Input
              name="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Contoh: Gedung Perkantoran Lt. 5, Jl. Jenderal Sudirman No. 10, Jakarta"
              maxLength={250}
            />
          </FormField>
        </div>

        <div>
          <FormField
            label="Nomor Telepon / WhatsApp Resmi"
            name="companyPhone"
            hint="Narahubung perbendaharaan internal."
          >
            <Input
              name="companyPhone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="Contoh: +62 812-3456-7890"
              maxLength={30}
            />
          </FormField>
        </div>

        <div>
          <FormField
            label="Email Keuangan / Resmi"
            name="companyEmail"
            hint="Alamat email perbendaharaan atau akunting."
          >
            <Input
              type="email"
              name="companyEmail"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="Contoh: finance@perusahaan.com"
              maxLength={100}
            />
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
          <span>{pending ? "Menyimpan Profil..." : "Simpan Profil Badan Usaha"}</span>
        </Button>
      </div>
    </form>
  );
}
