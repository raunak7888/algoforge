"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/Authcontext";
import { AnalysisResult } from "@/components/AnalysisResult";
import AnalysisForm from "../components/AnalysisForm";
import LoginButton from "../components/LoginButton";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthError(params.get("authError"));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-4xl font-bold mb-8">AlgoForge</h1>
        <p className="text-gray-600 mb-8">Sign in to analyze your code</p>
        {authError ? (
          <p className="mb-4 text-sm text-red-600">
            Authentication failed. Try again.
          </p>
        ) : null}
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">AlgoForge</h1>
            <p className="text-gray-600">Welcome, {user.name || user.email || "there"}</p>
          </div>
          <button
            onClick={() => void logout()}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <AnalysisForm
          onResult={(result) => {
            setErrorMessage(null);
            setAnalysisResult(result);
          }}
          onError={setErrorMessage}
        />
        {analysisResult && <AnalysisResult result={analysisResult} />}
      </div>
    </div>
  );
}
