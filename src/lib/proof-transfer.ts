/**
 * Manajemen Pengiriman File Bukti Nota Antar-Komponen di Browser.
 *
 * Menggantikan ketergantungan rapuh pada `sessionStorage` (yang sering melampaui kuota 5 MB
 * pada base64 foto kamera resolusi tinggi), dengan penyimpanan `File` langsung di memori
 * serta pengiriman sinyal via Custom Event `keuangan:proof-attached`.
 */

export interface ProofTransferPayload {
  file: File;
  meta?: {
    originalSize: number;
    compressedSize: number;
  };
}

let inMemoryPendingProof: ProofTransferPayload | null = null;

const PROOF_EVENT_NAME = "keuangan:proof-attached";

/**
 * Menyimpan file bukti sementara dan menyiarkan event ke form yang sedang aktif.
 */
export function setPendingProof(
  file: File,
  meta?: { originalSize: number; compressedSize: number },
) {
  inMemoryPendingProof = { file, meta };

  if (typeof window !== "undefined") {
    // Siarkan event custom agar jika form /transaksi/baru sedang terbuka, langsung menerima file
    window.dispatchEvent(
      new CustomEvent(PROOF_EVENT_NAME, {
        detail: { file, meta },
      }),
    );
  }
}

/**
 * Mengambil dan membersihkan file bukti yang sedang mengantre saat form baru dimuat.
 */
export function consumePendingProof(): ProofTransferPayload | null {
  if (!inMemoryPendingProof) return null;
  const data = inMemoryPendingProof;
  inMemoryPendingProof = null;
  return data;
}

/**
 * Mendaftarkan listener untuk menangkap foto yang baru saja dipotret/dipilih pengguna.
 */
export function subscribeToProofAttached(
  onAttached: (payload: ProofTransferPayload) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ProofTransferPayload>;
    if (customEvent.detail?.file) {
      onAttached(customEvent.detail);
    }
  };

  window.addEventListener(PROOF_EVENT_NAME, handler);
  return () => {
    window.removeEventListener(PROOF_EVENT_NAME, handler);
  };
}
