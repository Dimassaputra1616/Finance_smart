/**
 * Nama aplikasi, satu sumber untuk semua tempat yang menampilkannya: halaman
 * login, header mobile, judul tab, dan manifest PWA.
 *
 * Dulu tiap tempat menulis variannya sendiri ("Perbendaharaan Kas",
 * "Perbendaharaan & Kas Kantor", "Keuangan Pribadi"), jadi pengguna melihat
 * nama berbeda di tab, di layar utama HP, dan di halaman masuk.
 *
 * `short_name` di manifest dan judul `appleWebApp` sengaja tetap "Keuangan":
 * label ikon di layar utama dipotong sekitar 12 karakter.
 */
export const APP_NAME = "Perbendaharaan & Kas";

export const APP_TAGLINE = "Sistem pengendalian keuangan internal";
