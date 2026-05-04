# SisKeuDes Mobile

Aplikasi keuangan desa berbasis Next.js + Firebase RTDB, dibangun untuk operasional pemerintahan desa.

## Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Firebase Realtime Database (RTDB) + Firebase Auth
- **State**: Zustand + TanStack Query
- **PDF**: jsPDF (7 modul terpisah)
- **Deploy**: Vercel (auto-deploy via GitHub)

## Modul
| Modul | Path | Keterangan |
|---|---|---|
| Master Data | `/dashboard/master` | Kode rekening & bidang kegiatan |
| Perencanaan | `/dashboard/perencanaan` | Rencana kegiatan & pagu anggaran |
| APBDes | `/dashboard/apbdes` | Anggaran AWAL & PAK |
| DPA | `/dashboard/dpa` | Dokumen pelaksanaan anggaran |
| Penatausahaan | `/dashboard/penatausahaan` | BKU, SPP, SPJ, penerimaan, mutasi kas, pajak |
| Buku Pembantu | `/dashboard/buku-pembantu` | Bank, kas tunai, pajak, panjar |
| Pembukuan | `/dashboard/pembukuan` | Saldo awal & jurnal penyesuaian |
| Pelaporan | `/dashboard/pelaporan` | Cetak 40+ dokumen PDF |
| Pengaturan | `/dashboard/pengaturan` | Data desa & manajemen user |

## Environment Variables
Wajib di-set di Vercel Dashboard sebelum deploy:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

## Development
```bash
pnpm install
pnpm dev
```

## Build & Deploy
Push ke GitHub → Vercel auto-build dan deploy.
```bash
pnpm build   # verifikasi lokal sebelum push
```
