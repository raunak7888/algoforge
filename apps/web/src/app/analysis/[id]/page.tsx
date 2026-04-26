"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import LoginButton from "@/components/LoginButton";
import { AnalysisHistoryList } from "@/components/AnalysisHistoryList";
import { AnalysisResult } from "@/components/AnalysisResult";
import { useAuth } from "@/context/Authcontext";
import { useAnalysisHistoryStore } from "@/store/analysis-history";

export default function AnalysisDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const analysisId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isLoading, logout } = useAuth();
  const orderedHistoryIds = useAnalysisHistoryStore((state) => state.orderedHistoryIds);
  const historyById = useAnalysisHistoryStore((state) => state.historyById);
  const analysesById = useAnalysisHistoryStore((state) => state.analysesById);
  const activeDetailError = useAnalysisHistoryStore((state) => state.activeDetailError);
  const pageError = useAnalysisHistoryStore((state) => state.pageError);
  const hasMore = useAnalysisHistoryStore((state) => state.hasMore);
  const isFetchingPage = useAnalysisHistoryStore((state) => state.isFetchingPage);
  const fetchInitialPage = useAnalysisHistoryStore((state) => state.fetchInitialPage);
  const fetchNextPage = useAnalysisHistoryStore((state) => state.fetchNextPage);
  const fetchAnalysis = useAnalysisHistoryStore((state) => state.fetchAnalysis);
  const setActiveAnalysisId = useAnalysisHistoryStore((state) => state.setActiveAnalysisId);
  const analysis = analysisId ? analysesById[analysisId] ?? null : null;
  const historyItems = orderedHistoryIds.flatMap((id) => {
    const item = historyById[id];
    return item ? [item] : [];
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchInitialPage().catch((error) => {
      console.error("Failed to hydrate analysis history:", error);
    });
  }, [fetchInitialPage, user]);

  useEffect(() => {
    if (!user || !analysisId) {
      return;
    }

    setActiveAnalysisId(analysisId);
    void fetchAnalysis(analysisId).catch((error) => {
      console.error("Failed to load analysis detail:", error);
    });
  }, [analysisId, fetchAnalysis, setActiveAnalysisId, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-slate-100">
        <h1 className="text-3xl font-bold">AlgoForge</h1>
        <p className="text-sm text-slate-400">Sign in to access stored analyses.</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Stored Analysis</p>
            <h1 className="mt-2 text-3xl font-bold">Analysis Detail</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Back to workspace
            </Link>
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            {activeDetailError ? (
              <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {activeDetailError}
              </p>
            ) : null}
            {analysis ? (
              <AnalysisResult result={analysis} />
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Loading stored result from the database...
              </div>
            )}
          </div>
          <div>
            <AnalysisHistoryList
              analyses={historyItems}
              selectedId={analysisId}
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
