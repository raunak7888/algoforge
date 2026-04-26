"use client";

import { AnalysisResult } from "@/components/AnalysisResult";

export default function ShareClient({ analysis }: { analysis: any }) {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-center text-sm uppercase tracking-[0.25em] text-cyan-500">AlgoForge Shared Report</p>
          <h1 className="mt-2 text-center text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Code Analysis
          </h1>
          
          {analysis.creator && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {analysis.creator.avatarUrl ? (
                <img 
                  src={analysis.creator.avatarUrl} 
                  alt={analysis.creator.name || "Creator"} 
                  className="h-10 w-10 rounded-full border border-slate-700"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold text-slate-400">
                  {(analysis.creator.name || analysis.creator.username || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs uppercase tracking-widest text-slate-500">Shared by</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-200">{analysis.creator.name}</span>
                  {analysis.creator.username && (
                    <span className="text-xs text-slate-500">@{analysis.creator.username}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-8">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Original Code</h3>
              <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-sm leading-6 text-slate-200">
                <code>{analysis.code}</code>
              </pre>
            </section>

            <AnalysisResult result={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}
