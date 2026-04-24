"use client";

import { useState } from "react";
import { useAuth } from "../context/Authcontext";

export default function LoginButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);

            // Get Google OAuth URL
            const response = await fetch(
                "http://localhost:3001/api/auth/google",
            );
            const data = await response.json();

            // Open Google OAuth in popup
            const width = 500;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                data.url,
                "Google Login",
                `width=${width},height=${height},left=${left},top=${top}`,
            );

            // Listen for OAuth callback
            window.addEventListener("message", async (event) => {
                if (event.origin !== window.location.origin) return;

                if (event.data.type === "oauth-callback") {
                    popup?.close();

                    // Exchange code for token
                    const callbackResponse = await fetch(
                        "http://localhost:3001/api/auth/google/callback",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ code: event.data.code }),
                        },
                    );

                    const callbackData = await callbackResponse.json();

                    if (callbackData.token) {
                        login(callbackData.token, callbackData.user);
                    }

                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
            {isLoading ? "Logging in..." : "Sign in with Google"}
        </button>
    );
}
