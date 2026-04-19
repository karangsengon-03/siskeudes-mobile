"use client";

// src/app/dashboard/pengaturan/page.tsx
// Session 8 — Halaman Pengaturan

import { useState, useEffect } from "react";
import { ref, get, set, remove } from "firebase/database";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import type { UserProfile, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { User, Users, Plus, Trash2, Info, ShieldCheck, Eye, EyeOff } from "lucide-react";

const APP_VERSION = "1.0.0";
const APP_BUILD = "2026.04";

const ALL_ROLES: UserRole[] = [
  "PKPKD (Kades)",
  "Koordinator PPKD (Sekdes)",
  "Bendahara Desa (Kaur Keuangan)",
  "Operator",
];

const ROLE_BADGE: Record<UserRole, string> = {
  "PKPKD (Kades)": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Koordinator PPKD (Sekdes)": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Bendahara Desa (Kaur Keuangan)": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Operator": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ProfilSection() {
  const user = useAuthStore((s) => s.user);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGantiPassword() {
    if (!newPass || newPass.length < 6) { toast.error("Password baru minimal 6 karakter"); return; }
    if (newPass !== confirmPass) { toast.error("Konfirmasi password tidak cocok"); return; }
    if (!auth.currentUser?.email) return;
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, oldPass);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPass);
      toast.success("Password berhasil diganti");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Password lama salah");
      } else {
        toast.error("Gagal ganti password");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.nama}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
            {user.role}
          </span>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ganti Password</p>
        <div className="space-y-2">
          <Label className="text-xs">Password Lama</Label>
          <div className="relative">
            <Input type={showOld ? "text" : "password"} value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Password saat ini" className="pr-9 text-sm h-9" />
            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showOld ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Password Baru</Label>
          <div className="relative">
            <Input type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" className="pr-9 text-sm h-9" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Konfirmasi Password Baru</Label>
          <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" className="text-sm h-9" />
        </div>
        <Button size="sm" onClick={handleGantiPassword} disabled={loading || !oldPass || !newPass || !confirmPass} className="w-full">
          {loading ? "Menyimpan..." : "Ganti Password"}
        </Button>
      </div>
    </div>
  );
}

function ManajemenUserSection() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formNama, setFormNama] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("Operator");
  const [adding, setAdding] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);

  const isKades = currentUser?.role === "PKPKD (Kades)";
  const isSekdes = currentUser?.role === "Koordinator PPKD (Sekdes)";
  const canManage = isKades || isSekdes;

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const snap = await get(ref(db, "users"));
      if (snap.exists()) {
        const data = snap.val() as Record<string, Omit<UserProfile, "uid">>;
        const list: UserProfile[] = Object.entries(data).map(([uid, val]) => ({ uid, ...val }));
        list.sort((a, b) => ALL_ROLES.indexOf(a.role) - ALL_ROLES.indexOf(b.role));
        setUsers(list);
      } else {
        setUsers([]);
      }
    } catch { toast.error("Gagal memuat daftar user"); }
    finally { setLoadingUsers(false); }
  }

  async function handleTambahUser() {
    if (!formNama.trim() || !formEmail.trim() || !formPassword.trim()) { toast.error("Semua field harus diisi"); return; }
    if (formPassword.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setAdding(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formEmail.trim(), formPassword);
      await set(ref(db, `users/${cred.user.uid}`), {
        nama: formNama.trim(),
        email: formEmail.trim(),
        role: formRole,
        lastLogin: 0,
      });
      toast.success(`User ${formNama} berhasil ditambahkan`);
      toast.info("Silakan login ulang agar sesi admin tetap aktif", { duration: 5000 });
      setFormNama(""); setFormEmail(""); setFormPassword(""); setFormRole("Operator");
      await loadUsers();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") { toast.error("Email sudah terdaftar"); }
      else { toast.error("Gagal menambah user"); }
    } finally { setAdding(false); }
  }

  async function handleHapusUser(uid: string, nama: string) {
    if (uid === currentUser?.uid) { toast.error("Tidak bisa menghapus akun sendiri"); return; }
    try {
      await remove(ref(db, `users/${uid}`));
      toast.success(`Profil ${nama} dihapus`);
      await loadUsers();
    } catch { toast.error("Gagal menghapus user"); }
  }

  if (!canManage) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>Fitur ini hanya tersedia untuk Kades dan Sekdes.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadingUsers ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.uid} className="flex items-center gap-3 p-3 rounded-md border border-border bg-background">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {u.nama}{u.uid === currentUser?.uid && <span className="ml-1 text-xs text-muted-foreground">(Anda)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role]}`}>{u.role}</span>
              </div>
              {isKades && u.uid !== currentUser?.uid && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus user {u.nama}?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription asChild>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Data profil user akan dihapus dari database.</div>
                        <div>Akun Firebase Auth tetap ada — hapus manual di Firebase Console jika diperlukan.</div>
                      </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleHapusUser(u.uid, u.nama)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      {isKades && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tambah User Baru</p>
            <div className="space-y-2">
              <Label className="text-xs">Nama Lengkap</Label>
              <Input value={formNama} onChange={(e) => setFormNama(e.target.value)} placeholder="Nama user" className="text-sm h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@desa.id" className="text-sm h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input type={showFormPassword ? "text" : "password"} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimal 6 karakter" className="pr-9 text-sm h-9" />
                <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showFormPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleTambahUser} disabled={adding || !formNama || !formEmail || !formPassword} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {adding ? "Menambahkan..." : "Tambah User"}
            </Button>
            <p className="text-xs text-muted-foreground">Setelah menambah user, login ulang agar sesi admin tetap aktif.</p>
          </div>
        </>
      )}
    </div>
  );
}

function InfoVersiSection() {
  const infos = [
    { label: "Aplikasi", value: "SisKeuDes Mobile" },
    { label: "Versi", value: `v${APP_VERSION} (Build ${APP_BUILD})` },
    { label: "Framework", value: "Next.js 15 + TypeScript" },
    { label: "Database", value: "Firebase Realtime Database" },
    { label: "Desa", value: "Karang Sengon, Klabang, Bondowoso" },
    { label: "Tahun", value: "2026" },
  ];
  return (
    <div className="space-y-2">
      {infos.map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium text-right max-w-[55%]">{value}</span>
        </div>
      ))}
      <div className="pt-2 text-center">
        <Badge variant="outline" className="text-xs text-teal-600 border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800">
          ✓ Production Ready
        </Badge>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <div>
        <h1 className="text-base font-semibold">Pengaturan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Profil, keamanan, dan manajemen pengguna</p>
      </div>
      <Section icon={<User className="h-4 w-4" />} title="Profil & Password">
        <ProfilSection />
      </Section>
      <Section icon={<Users className="h-4 w-4" />} title="Manajemen Pengguna">
        <ManajemenUserSection />
      </Section>
      <Section icon={<Info className="h-4 w-4" />} title="Informasi Aplikasi">
        <InfoVersiSection />
      </Section>
    </div>
  );
}
