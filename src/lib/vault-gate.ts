/**
 * Logika "gerbang brankas" di halaman login: animasi pembuka yang cukup
 * diputar SEKALI per sesi tab, bukan tiap halaman login dibuka (termasuk setelah
 * keluar atau sesi habis).
 *
 * Pemisahan ini sengaja: bagian yang menentukan "sudah pernah diputar atau
 * belum" murni, tanpa React atau DOM sungguhan, supaya bisa diuji langsung.
 */

export const VAULT_STORAGE_KEY = "vault-gate-played";

/**
 * Atribut di <html> yang mematikan gerbang lewat CSS. Harus sama persis dengan
 * selektor `html[data-vault-played]` di `globals.css`; tes menjaga kesamaannya.
 */
export const VAULT_ATTRIBUTE = "data-vault-played";

/** Selang sebelum gerbang dianggap selesai diputar (ms). Sedikit di atas animasinya (0,9 dtk). */
export const VAULT_DURATION_MS = 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/**
 * Skrip inline untuk <head> root layout. Berjalan SEBELUM halaman digambar pada
 * muat ulang keras, jadi gerbang yang sudah pernah diputar tidak sempat
 * berkedip. Hanya membaca; penandaan "sudah diputar" dilakukan komponen setelah
 * animasinya selesai.
 */
export const VAULT_INIT_SCRIPT = `(function(){try{if(sessionStorage.getItem("${VAULT_STORAGE_KEY}")){document.documentElement.setAttribute("${VAULT_ATTRIBUTE}","1");}}catch(e){}})();`;

/**
 * Akses `window.sessionStorage` saja bisa melempar galat (cookie dan data situs
 * diblokir). Hasil `undefined` berarti "anggap belum pernah diputar".
 */
export function getSessionStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function hasPlayed(storage: StorageLike | null | undefined): boolean {
  try {
    return storage?.getItem(VAULT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPlayed(storage: StorageLike | null | undefined): void {
  try {
    storage?.setItem(VAULT_STORAGE_KEY, "1");
  } catch {
    // Penyimpanan diblokir: gerbang akan diputar lagi lain kali. Tidak fatal.
  }
}
