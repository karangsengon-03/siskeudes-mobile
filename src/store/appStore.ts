import { create } from "zustand";

function getMaxTahun(): number {
  const tahunBerjalan = new Date().getFullYear();
  const plusDua = tahunBerjalan + 2;
  return Math.max(plusDua, 2029); // minimal sampai 2029
}

function getTahunOptions(): string[] {
  const min = 2021;
  const max = getMaxTahun();
  const years: string[] = [];
  for (let y = min; y <= max; y++) {
    years.push(String(y));
  }
  return years;
}

interface AppState {
  tahunAnggaran: string;
  tahunOptions: string[];
  sidebarOpen: boolean;
  setTahunAnggaran: (tahun: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tahunAnggaran: String(new Date().getFullYear()),
  tahunOptions: getTahunOptions(),
  sidebarOpen: false,
  setTahunAnggaran: (tahun) => set({ tahunAnggaran: tahun }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));