"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, update } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // update RTDB tapi jangan block redirect jika gagal
    update(ref(db, `users/${cred.user.uid}`), {
      lastLogin: Date.now(),
      email: cred.user.email,
    }).catch(() => {});
    router.push("/dashboard");
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      toast.error("Email atau password salah");
    } else {
      toast.error("Gagal login, coba lagi");
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">SisKeuDes Mobile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desa Karang Sengon · 2026
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@karangsengon.desa.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2026 Pemerintah Desa Karang Sengon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}