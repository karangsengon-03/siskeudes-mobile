"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { UserProfile } from "@/lib/types";

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await get(ref(db, `users/${firebaseUser.uid}`));
          if (snap.exists()) {
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              ...snap.val(),
            };
            setUser(profile);
          } else {
            setUser({
              uid: firebaseUser.uid,
              nama: firebaseUser.email ?? "User",
              role: "kaur_keuangan",
              email: firebaseUser.email ?? "",
              lastLogin: Date.now(),
            });
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return { user, loading };
}