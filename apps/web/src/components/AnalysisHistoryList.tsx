"use client";

import Link from "next/link";
import type { AnalysisHistoryItem } from "@algoforge/analysis";

type Props = {
  analyses: AnalysisHistoryItem[];
  selectedId?: string | null;
  isLoading: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  onLoadMore: () => void;
};

export function AnalysisHistoryList({
  analyses,
  selectedId,
  isLoading,
  hasMore,
  errorMessage,
  onLoadMore,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Analysis History</h2>
          <p className="text-sm text-slate-400">Stored analyses only. No recomputation.</p>
        </div>
        <span className="text-sm text-slate-500">{analyses.length} loaded</span>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}

      {!analyses.length && !isLoading ? (
        <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-sm text-slate-400">
          No analyses found yet.
        </p>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => {
            const isSelected = selectedId === analysis.id;

            return (
              <Link
                key={analysis.id}
                href={`/analysis/${analysis.id}`}
                className={`block rounded-lg border px-4 py-3 text-sm ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-slate-100"
                    : "border-slate-800 bg-slate-900/70 text-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium uppercase tracking-wide">{analysis.language}</p>
                    <p className="mt-1 text-slate-400">
                      {analysis.suggestion ?? analysis.complexity ?? "Stored analysis"}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs text-slate-500">
                    {new Date(analysis.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
