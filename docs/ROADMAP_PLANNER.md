# Roadmap & Spesifikasi: Personal Finance Planner

Dokumen ini memuat arahan pengembangan fitur dari aplikasi "Keuangan Pribadi"
menjadi "Personal Finance Planner".

---

## Tujuan Aplikasi

Aplikasi ini bukan hanya pencatat pemasukan dan pengeluaran.
Arahkan aplikasi menjadi: **PERSONAL FINANCE PLANNER**

Tujuan utamanya:
1. Mengatur gaji bulanan.
2. Mengontrol pengeluaran.
3. Menentukan uang yang benar-benar aman digunakan.
4. Menyiapkan Dana Nikah.
5. Menyiapkan Dana Darurat.
6. Menyiapkan pengeluaran berkala seperti servis motor dan skincare.
7. Mengatur budget mingguan.
8. Memberikan insight berdasarkan transaksi nyata.
9. Membantu user tetap on-track sampai target keuangan tercapai.

---

## Kondisi Keuangan Default (Template Awal)

Gunakan data awal berikut sebagai contoh/default awal, tetapi tetap harus bisa diedit user dari aplikasi.

- **Gaji bulanan:** Rp4.650.000
- **Pengeluaran wajib:**
  1. Orang Tua: Rp1.000.000/bulan
  2. WiFi: Rp300.000/bulan
  *(PENTING: Orang Tua dan WiFi harus menjadi 2 kategori/transaksi berbeda, jangan digabung)*
- **Pengeluaran rutin:**
  3. Rokok: Sekitar Rp26.000/hari (± Rp182.000/minggu, ± Rp780.000/bulan)
  4. Bensin: Rp50.000/minggu (± Rp217.000/bulan)
  5. Makan: Sebagian besar masih ikut orang tua sehingga tidak perlu dibuat sebagai kewajiban tetap.
- **Pengeluaran berkala:**
  - Skincare, Servis motor, Ganti oli, Pajak kendaraan, Perawatan kendaraan, Pengeluaran pribadi lainnya.
- **Tujuan keuangan utama:** DANA NIKAH
- **Tujuan keuangan kedua:** DANA DARURAT

---

## Konsep Utama Money Flow

Ketika gaji masuk, aplikasi harus membantu user mengalokasikan uang dengan konsep:

```
Gaji (Rp4.650.000)
       ↓
Orang Tua (Rp1.000.000)
       ↓
WiFi (Rp300.000)
       ↓
Dana Nikah
       ↓
Dana Darurat
       ↓
Dana Berkala / Sinking Fund
       ↓
Budget Mingguan
       ↓
Available to Spend (Uang Aman Digunakan)
```

**Prinsip utama:**
JANGAN menganggap seluruh saldo rekening sebagai uang yang boleh dibelanjakan.
Harus ada perbedaan jelas antara:
- **TOTAL KEKAYAAN** (seluruh aset kas + piutang)
- **AVAILABLE TO SPEND** (saldo likuid dikurangi kewajiban belum dibayar, dana nikah, dana darurat, sinking fund, dan sisa budget)

---

## Rincian Modul & Fitur

### 1. Dashboard
- **Urutan informasi:**
  1. Available to Spend
  2. Kondisi budget bulan ini
  3. Progress Dana Nikah
  4. Dana Darurat
  5. Jatah minggu berjalan
  6. Total Kekayaan
  7. Cashflow
  8. Insight
- **Available to Spend Card:**
  `Saldo liquid - (kewajiban tersisa + dana nikah + dana darurat + sinking fund + budget teralokasi)`
- **Card Dana Nikah & Dana Darurat:**
  Menampilkan target nominal, saldo terkumpul, progress %, setoran bulan ini, target bulanan, estimasi tercapai.
- **Jatah Minggu Ini:**
  Budget vs terpakai per minggu, hari tersisa, status AMAN / WASPADA / OVER.

### 2. Menu Anggaran (Monthly Budget)
- Budget bulanan per kategori.
- Status: AMAN (0–70%), WASPADA (71–90%), HAMPIR HABIS (91–100%), OVER BUDGET (>100%).

### 3. Budget Mingguan
- Membagi budget kategori rutin ke minggu 1–5.
- Budget minggu depan tidak boleh otomatis terserap jika minggu ini habis sebelum waktunya (tampilkan warning).
- Sisa budget minggu lalu dapat di-*carry over* atau dipindahkan ke Dana Nikah.

### 4. Target Keuangan (Financial Goals)
- Default: Dana Nikah.
- Properti: nama goal, target nominal, saldo terkumpul (dihitung dari kontribusi), setoran bulanan, deadline, estimasi tercapai.
- CRUD goal + kontribusi setoran.

### 5. Dana Darurat
- Goal khusus dengan opsi target: 3x, 6x, 12x pengeluaran wajib bulanan, atau custom.
- Tidak boleh masuk Available to Spend.

### 6. Sinking Fund (Dana Berkala)
- Untuk pengeluaran non-bulanan (servis motor, pajak, skincare).
- Saldo menumpuk bulan ke bulan (tidak di-reset ke 0 setiap bulan).

### 7. Transaksi & Transfer
- Jenis: Pemasukan, Pengeluaran, Transfer, Setoran Goal, Setoran Sinking Fund.
- Transfer antar akun tidak boleh menambah atau mengurangi pemasukan/pengeluaran (hanya pindah saldo akun).

### 8. Transaksi Berulang (Recurring)
- Gaji, WiFi, Orang Tua, setoran rutin.
- Reminder jatuh tempo atau auto-create jika dipilih pengguna.

### 9. Insight Keuangan Lokal
- Perhitungan berbasis aturan lokal (tanpa API AI luar).
- Wording netral dan tidak menghakimi (misal: "Pengeluaran kategori X naik 20% dibanding bulan lalu").

### 10. Monthly Closing (Tutup Bulan)
- Snapshot bulanan perbandingan budget vs aktual.
- Rekomendasi pemindahan sisa budget (ke Dana Nikah / Dana Darurat / Carry Over).

### 11. Simulasi Target
- Simulasi target nikah berdasarkan setoran bulanan + potensi bonus/THR.

---

## Urutan Implementasi (Phase)

- **PHASE 1:** Perbaiki model keuangan fundamental (Account, Transaction, Transfer, Category, Available to Spend).
- **PHASE 2:** Budget bulanan.
- **PHASE 3:** Dana Nikah / Financial Goal.
- **PHASE 4:** Dana Darurat.
- **PHASE 5:** Sinking Fund.
- **PHASE 6:** Budget Mingguan.
- **PHASE 7:** Recurring Transaction.
- **PHASE 8:** Dashboard upgrade.
- **PHASE 9:** Insight lokal.
- **PHASE 10:** Monthly Closing.
- **PHASE 11:** Simulasi Target.
- **PHASE 12:** Polish UI.
