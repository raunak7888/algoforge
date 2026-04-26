"use client";

import { AnalysisResult } from "@/components/AnalysisResult";

export default function ShareClient({ analysis }: { analysis: any }) {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 border-b border-slate-800 pb-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-500">AlgoForge Shared Report</p>
          <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Code Analysis
          </h1>
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
