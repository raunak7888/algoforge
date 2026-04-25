"use client";

import { useState } from "react";
import { API_URL } from "@/lib/config";

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    try {
      setIsLoading(true);
      window.location.assign(`${API_URL}/api/auth/google/start`);
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
      {isLoading ? "Redirecting..." : "Sign in with Google"}
    </button>
  );
}
