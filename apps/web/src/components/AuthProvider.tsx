"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchMe } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const user = await fetchMe();
      setUser(user);
    }

    initAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
