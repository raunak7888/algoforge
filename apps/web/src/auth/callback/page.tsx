"use client";

import { useEffect } from "react";

export default function AuthCallback() {
    useEffect(() => {
        // Extract code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code && window.opener) {
            // Send code to parent window
            window.opener.postMessage(
                { type: "oauth-callback", code },
                window.location.origin,
            );
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Completing authentication...</p>
        </div>
    );
}
