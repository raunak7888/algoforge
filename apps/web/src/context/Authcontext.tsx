"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface User {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role: "USER" | "ADMIN";
}

interface AuthContextType {
    user: User | null;
    logout: () => Promise<void>;
    hydrateSession: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const hydrateSession = async (initial = false) => {
        try {
            if (initial) setIsLoading(true);

            const response = await apiFetch("/api/auth/session");

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Session bootstrap failed:", error);
            setUser(null);
        } finally {
            if (initial) setIsLoading(false);
        }
    };

    useEffect(() => {
        void hydrateSession(true);
    }, []);

    const logout = async () => {
        try {
            await apiFetch("/api/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        }

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, logout, hydrateSession, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
