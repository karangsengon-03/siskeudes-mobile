# Siskeudes Mobile — Sesi 6 (Selesai)

Lihat SISKEUDES_MOBILE_MASTER_README.md untuk blueprint lengkap.

## Sesi 6: PDF Baru Penganggaran

### File yang berubah:
- `src/lib/generatePDF.ts` — +7 fungsi PDF baru (18 total)
- `src/hooks/usePelaporan.ts` — tambah data PAK (APBDes PAK + meta)
- `src/app/dashboard/pelaporan/page.tsx` — card APBDes, card PAK, card Analisis Penganggaran

### Fungsi PDF baru (Sesi 6):
1. `downloadPDF_RABPendapatan` — RAB Pendapatan (portrait, TTD Kades+Sekdes)
2. `downloadPDF_RABPembiayaan` — RAB Pembiayaan (portrait, TTD Kades+Sekdes)
3. `downloadPDF_PAKGlobal` — PAK 1A (wrapper APBDesGlobal dengan label PAK)
4. `downloadPDF_PAKPerKegiatan` — PAK 1B (wrapper APBDesPerKegiatan dengan label PAK)
5. `downloadPDF_PAKRinci` — PAK 1C (wrapper APBDesRinci dengan label PAK)
6. `downloadPDF_LaporanSumberDana` — Rekap per Sumber Dana (landscape, breakdown DD/ADD/PAD/BHPR/BKP/BKK/LAIN)
7. `downloadPDF_ProporsiBelanjaOperasional` — Proporsi Operasional vs Pembangunan (portrait, ringkasan kotak)
