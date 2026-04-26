"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type SafeUser } from "@algoforge/analysis";
import { apiFetch } from "@/lib/api";
import { useAnalysisHistoryStore } from "@/store/analysis-history";

interface AuthContextType {
    user: SafeUser | null;
    logout: () => Promise<void>;
    hydrateSession: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SafeUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const resetAnalysisHistory = useAnalysisHistoryStore((state) => state.reset);

    const hydrateSession = async (initial = false) => {
        try {
            if (initial) setIsLoading(true);

            // Using /api/auth/me as per new requirements for safe user profile
            const response = await apiFetch("/api/auth/me");

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
                if (initial) resetAnalysisHistory();
            }
        } catch (error) {
            console.error("Session bootstrap failed:", error);
            setUser(null);
            resetAnalysisHistory();
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
        resetAnalysisHistory();
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
