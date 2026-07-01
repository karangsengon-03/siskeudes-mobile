// src/lib/constants/version.ts
//
// Sumber kebenaran TUNGGAL untuk versi aplikasi. Jangan hardcode versi di
// tempat lain (Sidebar, Pengaturan, dll) — selalu import dari sini.
//
// Skema versi mengikuti Semantic Versioning (semver):
//   MAJOR.MINOR.PATCH
//   - MAJOR: perubahan besar/breaking change pada struktur data atau alur kerja
//   - MINOR: penambahan fitur baru atau update data master signifikan
//            (mis. update kode rekening/bidang kegiatan ke versi Siskeudes terbaru)
//            tanpa breaking change
//   - PATCH: perbaikan bug, optimasi, dan penyesuaian kecil tanpa fitur baru
//
// Versi ini WAJIB di-update setiap sesi pengembangan yang menghasilkan ZIP baru,
// dan harus sinkron dengan README.md § Changelog serta nama file ZIP akhir.

export const APP_VERSION = "1.1.0";

// Build identifier: TAHUN.SESI (sesi pengembangan ke berapa)
export const APP_BUILD = "2026.21";

// Tanggal rilis versi ini (untuk ditampilkan di halaman Pengaturan)
export const APP_RELEASE_DATE = "2026-06-30";
