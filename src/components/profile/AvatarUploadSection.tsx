"use client";

import { useRef, useState } from "react";
import { uploadAvatar, removeAvatar } from "@/server/actions/avatar";
import { compressImageToWebP } from "@/lib/image-compress";
import { UserAvatar } from "@/components/users/UserAvatar";
import { IconCamera, IconClose } from "@/components/Icons";
import { Alert, alertDuration, Button } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Komponen Pengelolaan Foto Profil di Halaman /profil.
 * Pengguna dapat mengunggah foto selfie atau foto resmi, otomatis dikompres ke WebP 400px.
 */
export function AvatarUploadSection({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult>(INITIAL_RESULT);
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null);
  const [key, setKey] = useState(Date.now());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImageToWebP(file, 400, 0.85);
      const formData = new FormData();
      formData.append("avatar", compressed, "avatar.webp");
      setPending(true);
      const res = await uploadAvatar(INITIAL_RESULT, formData);
      setResult(res);
      setRemoveResult(null);
      setKey(Date.now());
    } catch {
      setResult({ ok: false, message: "Gagal menyimpan foto profil." });
    } finally {
      setIsCompressing(false);
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setPending(true);
    try {
      const res = await removeAvatar();
      setRemoveResult(res);
      setResult(INITIAL_RESULT);
      setKey(Date.now());
    } finally {
      setPending(false);
    }
  };

  const activeMessage = result.message || removeResult?.message;
  const isSuccess = result.ok || removeResult?.ok;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Pratinjau Avatar Besar */}
      <div className="relative shrink-0">
        <UserAvatar
          key={key}
          userId={userId}
          name={name}
          size="xl"
          className="shadow-md ring-4 ring-surface-muted"
        />
        {isCompressing || pending ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/40 backdrop-blur-xs">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : null}
      </div>

      {/* Kontrol Aksi Unggah */}
      <div className="space-y-3 flex-1 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-bold text-foreground">Foto Profil</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Format JPEG, PNG, WebP, atau kamera HP. Otomatis dikompres tajam &amp; proporsional.
          </p>
        </div>

        {activeMessage ? (
          <Alert
            key={activeMessage}
            tone={isSuccess ? "success" : "error"}
            duration={alertDuration(result.message ? result : removeResult!)}
          >
            {activeMessage}
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileChange}
            className="sr-only"
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isCompressing || pending}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <IconCamera className="h-4 w-4" />
            <span>Pilih Foto Baru</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isCompressing || pending}
            onClick={handleRemove}
            className="gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <IconClose className="h-3.5 w-3.5" />
            <span>Hapus Foto</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
