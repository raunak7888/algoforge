"use client";

import type { ReactNode } from "react";
import type { AnalysisRecord } from "@algoforge/analysis";

type Props = {
  result: AnalysisRecord;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function AnalysisResult({ result }: Props) {
  return (
    <div className="mt-8 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Analysis Result</h2>
          <p className="mt-2 text-sm text-slate-400">
            Stored at {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {result.language}
        </div>
      </div>

      <Section title="Summary">
        <p className="text-sm leading-7 text-slate-200">{result.result.summary}</p>
      </Section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Best Time" value={result.result.complexity.time.best} />
        <Metric label="Average Time" value={result.result.complexity.time.average} />
        <Metric label="Worst Time" value={result.result.complexity.time.worst} />
        <Metric label="Space" value={result.result.complexity.space} />
      </div>

      <Section title="Breakdown">
        <p className="text-sm leading-7 text-slate-200">{result.result.breakdown.approach}</p>
        <ol className="mt-4 space-y-2 text-sm text-slate-300">
          {result.result.breakdown.steps.map((step, index) => (
            <li key={`${step}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Bottlenecks">
        <div className="space-y-3">
          {result.result.bottlenecks.length ? (
            result.result.bottlenecks.map((item, index) => (
              <div key={`${item.issue}-${index}`} className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                <p className="font-medium text-amber-100">{item.issue}</p>
                <p className="mt-2 text-sm text-slate-300">{item.impact}</p>
                {item.location ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-300/80">
                    {item.location}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No significant bottlenecks detected.</p>
          )}
        </div>
      </Section>

      <Section title="Anti-Patterns">
        <div className="flex flex-wrap gap-2">
          {result.result.antiPatterns.length ? (
            result.result.antiPatterns.map((item, index) => (
              <span key={`${item}-${index}`} className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-sm text-rose-100">
                {item}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-400">No anti-patterns detected.</p>
          )}
        </div>
      </Section>

      <Section title="Improvements">
        <div className="space-y-3">
          {result.result.improvements.length ? (
            result.result.improvements.map((item, index) => (
              <div key={`${item.suggestion}-${index}`} className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                <p className="font-medium text-emerald-100">{item.suggestion}</p>
                <p className="mt-2 text-sm text-slate-300">{item.expectedImpact}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No improvements suggested.</p>
          )}
        </div>
      </Section>

      <Section title="Optimized Code">
        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-black/40 p-4 text-sm leading-6 text-slate-200">
          <code>{result.result.optimizedCode}</code>
        </pre>
      </Section>

      {result.result.comparison ? (
        <Section title="Comparison">
          <p className="text-sm leading-7 text-slate-200">
            {result.result.comparison.originalVsOptimized}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            {result.result.comparison.improvementSummary}
          </p>
        </Section>
      ) : null}

      <Section title="Edge Cases">
        <div className="flex flex-wrap gap-2">
          {result.result.edgeCases.length ? (
            result.result.edgeCases.map((item, index) => (
              <span key={`${item}-${index}`} className="rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1 text-sm text-blue-100">
                {item}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-400">No edge cases reported.</p>
          )}
        </div>
      </Section>

      {typeof result.result.readabilityScore === "number" || result.result.tags?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {typeof result.result.readabilityScore === "number" ? (
            <Section title="Readability Score">
              <p className="text-3xl font-semibold text-slate-50">{result.result.readabilityScore}/100</p>
            </Section>
          ) : null}
          {result.result.tags?.length ? (
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {result.result.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
