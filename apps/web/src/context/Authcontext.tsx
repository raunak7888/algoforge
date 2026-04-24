"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) {
            verifyToken(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (tokenToVerify: string) => {
        try {
            const response = await fetch(
                "http://localhost:3001/api/auth/verify",
                {
                    headers: {
                        Authorization: `Bearer ${tokenToVerify}`,
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(tokenToVerify);
            } else {
                localStorage.removeItem("auth_token");
            }
        } catch (error) {
            console.error("Token verification failed:", error);
            localStorage.removeItem("auth_token");
        } finally {
            setIsLoading(false);
        }
    };

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
