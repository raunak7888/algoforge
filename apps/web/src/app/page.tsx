"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/Authcontext";
import { AnalysisHistoryList } from "@/components/AnalysisHistoryList";
import { AnalysisResult } from "@/components/AnalysisResult";
import { useAnalysisHistoryStore } from "@/store/analysis-history";
import AnalysisForm from "../components/AnalysisForm";
import LoginButton from "../components/LoginButton";

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const orderedHistoryIds = useAnalysisHistoryStore((state) => state.orderedHistoryIds);
  const historyById = useAnalysisHistoryStore((state) => state.historyById);
  const analysesById = useAnalysisHistoryStore((state) => state.analysesById);
  const activeAnalysisId = useAnalysisHistoryStore((state) => state.activeAnalysisId);
  const pageError = useAnalysisHistoryStore((state) => state.pageError);
  const hasMore = useAnalysisHistoryStore((state) => state.hasMore);
  const isFetchingPage = useAnalysisHistoryStore((state) => state.isFetchingPage);
  const fetchInitialPage = useAnalysisHistoryStore((state) => state.fetchInitialPage);
  const fetchNextPage = useAnalysisHistoryStore((state) => state.fetchNextPage);
  const cacheAnalysis = useAnalysisHistoryStore((state) => state.cacheAnalysis);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthError(params.get("authError"));
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchInitialPage().catch((error) => {
      console.error("Failed to hydrate analysis history:", error);
    });
  }, [fetchInitialPage, user]);

  const historyItems = useMemo(
    () =>
      orderedHistoryIds.flatMap((id) => {
        const item = historyById[id];
        return item ? [item] : [];
      }),
    [historyById, orderedHistoryIds],
  );

  const activeAnalysis = activeAnalysisId ? analysesById[activeAnalysisId] ?? null : null;
  const latestHistoryAnalysis = historyItems[0] ?? null;

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
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold">AlgoForge</h1>
            <p className="text-slate-400">Welcome, {user.name || user.email || "there"}</p>
          </div>
          <div className="flex items-center gap-3">
            {latestHistoryAnalysis ? (
              <Link
                href={`/analysis/${latestHistoryAnalysis.id}`}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Open latest
              </Link>
            ) : null}
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Logout
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            <AnalysisForm
              onResult={(result) => {
                setErrorMessage(null);
                cacheAnalysis(result);
              }}
              onError={setErrorMessage}
            />
            {activeAnalysis ? <AnalysisResult result={activeAnalysis} /> : null}
          </div>
          <div>
            <AnalysisHistoryList
              analyses={historyItems}
              selectedId={activeAnalysisId}
              isLoading={isFetchingPage}
              hasMore={hasMore}
              errorMessage={pageError}
              onLoadMore={() => {
                void fetchNextPage().catch((error) => {
                  console.error("Failed to fetch the next analysis page:", error);
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
