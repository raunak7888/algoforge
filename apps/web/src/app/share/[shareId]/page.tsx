import { API_URL } from "@/lib/config";
import ShareClient from "./ShareClient";
import type { Metadata } from "next";

async function getAnalysis(shareId: string) {
  const res = await fetch(`${API_URL}/api/share/${shareId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const analysis = await getAnalysis(shareId);

  if (!analysis) {
    return {
      title: "Analysis Not Found - AlgoForge",
    };
  }

  return {
    title: `Code Analysis - ${analysis.language}`,
    description: `Check out this ${analysis.language} code analysis on AlgoForge. Complexity: ${analysis.result.complexity.time.worst}.`,
    openGraph: {
      title: "AlgoForge - Shareable Code Report",
      description: `Deep-dive analysis of ${analysis.language} code.`,
      type: "website",
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const analysis = await getAnalysis(shareId);

  if (!analysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-slate-100">
        <h1 className="text-3xl font-bold text-red-500">Not Found</h1>
        <p className="text-slate-400">This analysis report does not exist or is no longer public.</p>
      </div>
    );
  }

  return <ShareClient analysis={analysis} />;
}
