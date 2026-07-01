# SisKeuDes Mobile

Aplikasi pengelolaan keuangan desa berbasis web (PWA) yang mereplikasi Siskeudes Desktop v2.0.9, dibangun untuk Desa Karang Sengon, Kecamatan Klabang, Kabupaten Bondowoso. Dipakai langsung di lapangan oleh operator keuangan desa untuk Perencanaan, Penganggaran (APBDes/DPA), Penatausahaan (SPP/SPJ/Penerimaan), Pembukuan (BKU, Buku Pembantu), dan Pelaporan (LRA, dll), sesuai Permendagri 20/2018 dan standar BPKP/Kemendagri.

**Versi saat ini:** lihat [§ Versi & Status](#versi--status) di bawah — README ini adalah **sumber kebenaran tunggal** untuk versi, riwayat perubahan, dan status aplikasi. Jangan mengandalkan dokumen lain.

---

## Daftar Isi

- [Tumpukan Teknologi](#tumpukan-teknologi)
- [Struktur Modul](#struktur-modul)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Deploy](#deploy)
- [Versi & Status](#versi--status)
- [Changelog](#changelog)

---

## Tumpukan Teknologi

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript (strict mode) |
| UI | Tailwind CSS v4 (CSS-first `@theme`), shadcn/ui, Plus Jakarta Sans + JetBrains Mono |
| Database | Firebase Realtime Database |
| Autentikasi | Firebase Auth (single-operator + admin) |
| State | Zustand (`authStore`, `appStore`) |
| Data fetching | TanStack Query (React Query) |
| Form | react-hook-form |
| PDF | Generator internal (`src/lib/generatePDF.*.ts`), 7 modul domain |
| PWA | Service worker custom (`public/sw.js`), cache-first untuk asset statis |
| Testing | Vitest (36 unit test) |
| Deploy | Vercel, auto-deploy dari `main` branch via GitHub Actions/CI |

---

## Struktur Modul

```
src/
├── app/dashboard/
│   ├── perencanaan/        Perencanaan kegiatan (CRUD, lock/unlock, validasi pagu)
│   ├── apbdes/              APBDes Awal & Perubahan (PAK) — Pendapatan, Belanja, Pembiayaan
│   ├── dpa/                 Dokumen Pelaksanaan Anggaran (rincian per-bulan)
│   ├── penatausahaan/       SPP, SPJ, Penerimaan, Mutasi Kas, Setor Pajak, BKU
│   ├── pembukuan/           Saldo Awal, Jurnal Penyesuaian
│   ├── buku-pembantu/       Buku Bank, Kas Tunai, Pajak, Panjar (turunan dari BKU)
│   ├── pelaporan/           LRA & laporan kekayaan desa (cetak PDF)
│   ├── master/               Master data (kode rekening, bidang/kegiatan, pajak)
│   └── pengaturan/           Profil desa, user, info versi aplikasi
├── components/modules/      Komponen per-modul (form, list, view)
├── hooks/                   Data layer — satu hook per domain (lihat di bawah)
└── lib/
    ├── constants/            kodeRekening.ts, bidangKegiatan.ts, pajak.ts, version.ts
    └── generatePDF.*.ts      7 modul: shared, apbdes, penganggaran, register, spp, buku, lra
```

### Peta Hook → Sumber Data (penting untuk konsistensi)

Beberapa angka ditampilkan di lebih dari satu menu dan **wajib bersumber dari logika yang sama** agar tidak terjadi selisih. Tabel ini adalah peta dependensi resminya:

| Hook | Dipakai oleh | Sumber kebenaran logika |
|---|---|---|
| `useBKU()` | Penatausahaan → BKU, `usePelaporan.ts` | Single source untuk semua entri jurnal kas |
| `useSaldoBank()` / `useSaldoTunai()` | (referensi logika) | Filter `useBKU` berbasis **field** (`jenisPembayaran`/`mediaPembayaran`), bukan tebak dari nilai |
| `isRelevant()` di `useBukuPembantu.ts` | Buku Bank, Buku Kas Tunai | **Harus identik** secara logika dengan `useSaldoBank`/`useSaldoTunai` di atas — lihat catatan di kode |
| `usePelaporan.ts` → `hitungSaldoMedia()` | LRA, Laporan Kekayaan Desa | Re-implementasi field-based yang sama, dihitung kumulatif sejak awal tahun s.d. akhir periode laporan |

> ⚠️ **Jika mengubah salah satu dari tiga implementasi di atas, WAJIB mengubah yang lain secara bersamaan.** Ketiganya sengaja diberi komentar saling-silang di kode untuk mengingatkan hal ini. Riwayat bug v1.1.0 (lihat Changelog) terjadi justru karena tiga tempat ini sempat memakai logika berbeda.

---

## Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial Firebase project Anda
npm run dev
```

Wajib lulus sebelum commit/push:
```bash
npx tsc --noEmit   # harus 0 error
npm run build      # harus build sukses, semua route statis
```

## Deploy

Repo: `karangsengon-03/siskeudes-mobile` → auto-deploy ke Vercel pada setiap push ke `main`. Pastikan `npx tsc --noEmit` bersih sebelum push — Vercel akan gagal build jika ada error TypeScript.

Environment variables (Vercel → Project Settings → Environment Variables), sesuai `.env.example`:
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.

---

## Versi & Status

| | |
|---|---|
| **Versi** | v1.1.0 |
| **Build** | 2026.21 |
| **Tanggal rilis** | 30 Juni 2026 |
| **Status** | Production-ready |
| **TypeScript** | 0 error (`tsc --noEmit`) |
| **Build** | 15 route, semua statis |

Sumber kebenaran versi di kode: `src/lib/constants/version.ts`. Ditampilkan otomatis di Sidebar (header) dan halaman Pengaturan → Informasi Aplikasi.

### Skema Versi

Mengikuti [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- **MAJOR** — perubahan besar/breaking change pada struktur data Firebase atau alur kerja
- **MINOR** — fitur baru, atau update data master signifikan (mis. update kode rekening ke versi Siskeudes terbaru) tanpa breaking change
- **PATCH** — perbaikan bug, optimasi, penyesuaian kecil tanpa fitur baru

---

## Changelog

### v1.1.0 — 30 Juni 2026 (Sesi 21–22)

**Update Data Master — Kode Rekening Siskeudes Desktop V209/2026**
- `kodeRekening.ts` ditulis ulang lengkap: 266 entri kode rekening 4-level (Kelompok → Jenis → Obyek → Rincian Obyek) untuk Pendapatan (4), Belanja (5), dan Pembiayaan (6), sesuai update terbaru Siskeudes Desktop V2.0.9/2026.
- Ditambahkan kode yang sebelumnya hilang: **5.1.1.07** (Penyediaan Insentif/Operasional RT/RW) dan **5.1.1.08** (Penyediaan Operasional Pemerintah Desa dari Dana Desa) — kode ini sudah ada di `bidangKegiatan.ts` tapi belum disinkronkan ke `kodeRekening.ts`.
- Diperbaiki kode 5.1.2 (Sarana Prasarana Pemerintahan Desa) yang sebelumnya tidak lengkap.

**Perbaikan Kritis — Nilai Desimal Tidak Bisa Disimpan**
- Root cause: `Number("48232,91")` mengembalikan `NaN`, dan `parseFloat("48232,91")` memotong di koma menjadi `48232` (kehilangan desimal) — input keuangan dengan format Indonesia (koma sebagai pemisah desimal) gagal tersimpan dengan benar di hampir semua form.
- Ditambahkan utility `parseDecimalId()` di `src/lib/utils.ts` yang menormalisasi format Indonesia (`48.232,91`) maupun internasional (`48232.91`) menjadi angka yang benar.
- Diterapkan ke seluruh titik input nilai: `FormPendapatan`, `FormPembiayaan`, `FormKegiatan` (volume & harga satuan RAB), `FormSPP` (rincian belanja), `FormSPJ` (nilai realisasi & dasar pengenaan pajak), `FormPenerimaan`, `PenerimaanList` (edit), `DPAView` (input RAK per-bulan).

**Perbaikan Kritis — Nilai 0 (Nol) Tidak Bisa Disimpan**
- Validasi `min: 1` pada `FormPendapatan` dan `FormPembiayaan` mencegah penyimpanan nilai anggaran nol, padahal secara bisnis nilai nol adalah input yang sah (mis. pagu yang sengaja dikosongkan sementara). Diubah ke `min: 0`.

**Perbaikan Kritis — Crash Halaman Setor Pajak**
- Root cause ditemukan: Firebase Realtime Database menyimpan array kosong (`[]`) sebagai `null`. Item hutang pajak saldo awal yang disimpan dengan `bukuPembantuPajakIds: []` kembali sebagai `null` saat dibaca, menyebabkan `p.bukuPembantuPajakIds.length` melempar `TypeError` setiap kali menu Setor Pajak dibuka setelah ada transaksi hutang pajak — menampilkan halaman error generik *"This page couldn't load"*.
- Diperbaiki di `usePenyetoranPajak.ts`: safe-guard `Array.isArray()` untuk `bukuPembantuPajakIds`, plus fallback untuk field opsional lain (`uraian`, `namaPajak`, `kodePajak`, `nomorSetor`) yang bisa kosong dari data lama.
- Bug turunan ditemukan & diperbaiki sekaligus: entri BKU untuk setor hutang pajak tidak menyimpan `penyetoranPajakId`, sehingga saat dihapus meninggalkan entri BKU yatim. Sekarang juga dicocokkan via `nomorRef` + `jenisRef` sebagai fallback. Field `penyetoranPajakId` ditambahkan sebagai opsional ke tipe `BKUItem`.

**Perbaikan Fundamental — Inkonsistensi Logika Buku Bank/Kas Tunai vs BKU**

Ditemukan bahwa Buku Pembantu Bank & Kas Tunai memakai logika filter (`isRelevant()`) yang **berbeda dan sebagian salah** dibanding logika yang sudah benar di Penatausahaan BKU (`BKUView.tsx`) dan `useSaldoBank()`/`useSaldoTunai()`:

- **Bug paling serius:** untuk transaksi *Mutasi Kas* arah "Tunai ke Bank", `isRelevant()` lama menebak sisi bank/tunai dari **nilai** (`penerimaan > 0` / `pengeluaran > 0`) alih-alih dari **field** `jenisPembayaran` yang memang sudah eksplisit tersimpan di setiap entri. Karena satu transaksi mutasi kas menghasilkan **dua entri BKU terpisah** dengan arah nilai berbeda tergantung arah mutasi, logika tebak-nilai ini benar secara kebetulan untuk arah "Bank ke Tunai" tapi **terbalik 180°** untuk arah "Tunai ke Bank" — pengeluaran tunai (setor ke bank) hilang dari Buku Kas Tunai dan muncul salah di Buku Bank, begitu pula sebaliknya untuk penerimaan.
- `saldo_awal` (SiLPA bank/tunai) tidak pernah dicek sama sekali di `isRelevant()` — saldo awal tidak pernah muncul di Buku Pembantu Bank/Tunai walaupun selalu muncul di Penatausahaan BKU.
- `penyetoran_hutang_pajak` juga tidak pernah dicek — transaksi setor hutang pajak saldo awal hilang dari Buku Pembantu.
- `spj_titipan_pajak` tidak punya entri sama sekali di filter mode "tunai" pada `BKUView.tsx`, walaupun medianya tunai — diperbaiki agar konsisten field-based di semua tempat.

`isRelevant()` ditulis ulang total memakai `switch (item.jenisRef)` dengan logika field-based murni (membaca `jenisPembayaran`/`mediaPembayaran` langsung, dengan default yang konsisten persis seperti `useSaldoBank`/`useSaldoTunai`), mencakup seluruh jenis referensi BKU yang ada (termasuk yang sebelumnya hilang). Komentar silang-referensi ditambahkan di tiga lokasi terkait untuk mencegah divergensi logika di masa depan.

**Perbaikan Fundamental — Saldo Akhir LRA Tidak Akurat**

Ditemukan saat audit lanjutan bahwa `saldoKasTunaiAkhir` dan `saldoBankAkhir` di `usePelaporan.ts` (dipakai di dokumen resmi LRA) dihitung memakai **estimasi rasio** (`saldoKasAkhir × rasio_saldo_awal`) — bukan perhitungan aktual per-transaksi, padahal logika akurat untuk ini sudah ada (`useSaldoBank`/`useSaldoTunai`). Selain itu `saldoKasAkhir` sendiri salah saat laporan difilter ke bulan tertentu, karena dihitung dari running-balance BKU yang **sudah difilter ke bulan itu saja** (mengabaikan saldo kumulatif bulan-bulan sebelumnya).

Diperbaiki dengan:
- Menambah fetch BKU tanpa filter bulan (`bkuKumulatif`) khusus untuk perhitungan saldo akhir kumulatif.
- `saldoKasAkhir`, `saldoKasTunaiAkhir`, `saldoBankAkhir` kini dihitung dari BKU kumulatif yang dipotong sampai akhir periode laporan terpilih (bukan estimasi rasio, bukan running-balance versi terfilter).
- Fungsi `hitungSaldoMedia()` baru ditulis dengan logika field-based yang identik dengan `isRelevant()`/`useSaldoBank`/`useSaldoTunai` di atas.

**Infrastruktur & Tata Kelola Proyek**
- `.gitignore` dibuat — sebelumnya **tidak ada sama sekali** di repo, berisiko meng-commit `node_modules` dan kredensial Firebase di `.env.local` ke git history.
- `.env.example` dibuat sebagai dokumentasi variabel environment tanpa membocorkan kredensial asli.
- Versi aplikasi disentralisasi ke `src/lib/constants/version.ts` sebagai satu sumber kebenaran — sebelumnya `Sidebar.tsx` hardcode `v1.0` dan `pengaturan/page.tsx` hardcode `1.0.0`/Build `2026.04` secara independen dan tidak sinkron, juga tidak sinkron dengan `package.json` (`0.1.0`).
- `package.json` version disinkronkan ke `1.1.0`.
- Halaman Pengaturan: field "Tahun" yang sebelumnya hardcode `"2026"` diubah menjadi "Tahun Anggaran Aktif" yang mengikuti state `tahunAnggaran` dinamis dari `appStore`; label Framework diperbarui dari "Next.js 15" (usang) ke "Next.js 16" sesuai versi aktual di `package.json`.
- README.md ditulis ulang total sebagai sumber kebenaran tunggal proyek (sebelumnya generic boilerplate `create-next-app`).

---

### v1.0.0 dan sebelumnya — Ringkasan Riwayat Pengembangan

> Detail penuh per-sesi sebelum v1.1.0 tersedia di riwayat percakapan pengembangan; ringkasan di bawah mencakup tonggak utama.

**Sesi 18–20 (Mei 2026) — Audit & Hardening Menyeluruh**
- Audit penuh aplikasi menghasilkan perbaikan: bug global `adaSPJ` yang memblokir semua edit SPP (diubah jadi cek per-SPP), saldo berjalan BKU yang salah (filter bulan diterapkan sebelum akumulasi, bukan sesudah), field `penyetoran_hutang_pajak` hilang dari filter relevansi, field `sudahSPJ?` hilang dari tipe `SPPItem`, delete non-atomik di `useDeletePenyetoranPajak`, komentar Firestore yang menyesatkan di `logger.ts`.
- Aturan keamanan RTDB baru dengan kontrol akses per-node.
- Upgrade Next.js ke 16.2.6 (Turbopack) dengan React 19.2.6.
- `FormPendapatan.tsx` dipulihkan (sempat 0 byte); sisa panjar di `useSPJ.ts` membawa `mediaPembayaran` dari SPP asal; `useSaldoAwal.ts` menulis dua entri BKU bertanggal 1 Januari; perbaikan tipe `BKUItem`/`PenyetoranPajakItem`.

**Sesi 14–17 (Mei 2026) — Standardisasi UI**
- Semua form overlay dikonversi dari Dialog ke Sheet bottom-sheet; sidebar Buku Pembantu diredesain; navigasi tree DPA diubah dari single-selection ke multi-expand.

**Sesi 11–13 (Mei 2026) — Audit Build Komprehensif**
- Zero error TypeScript, unhandled promise rejection diperbaiki di semua form, overflow `DialogContent` diperbaiki di 14 dialog, modul Perencanaan diredesain selaras layout APBDes.

**Sesi 4–10 (April–Mei 2026) — Arsitektur Inti**
- APBDes mendukung varian AWAL/PAK dengan UI bertab; `generatePDF.ts` (40 fungsi, 4.352 baris) dipecah menjadi 7 modul domain + barrel export; seluruh fungsi PDF didesain ulang mengikuti format Siskeudes Desktop; penomoran dokumen atomik via RTDB transaction; migrasi path RTDB multi-tahun ke `siskeudesOnline/tahun/${tahun}/`.

**Desain Sistem (Mei 2026)**
- Tailwind v4 (CSS-first, `@theme {}`); token desain di `src/tokens/`; Plus Jakarta Sans + JetBrains Mono; 36 unit test Vitest; model permission single-operator.

---

## Lisensi & Penggunaan

Aplikasi internal milik Desa Karang Sengon. Tidak untuk distribusi tanpa izin pengelola.
