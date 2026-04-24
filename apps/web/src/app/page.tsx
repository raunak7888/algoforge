"use client";

import { useState } from "react";
import { AnalysisForm } from "@/components/AnalysisForm";
import { AnalysisResult } from "@/components/AnalysisResult";

export type AnalysisResponse = {
    id: string;
    language: string;
    complexity: string;
    suggestion: string;
    timeEstimate: string;
    createdAt: string;
};

export default function HomePage() {
    const [result, setResult] = useState<AnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px" }}>
            <h1
                style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#a78bfa",
                    marginBottom: 4,
                }}
            >
                ⚡ AlgoForge
            </h1>
            <p style={{ color: "#6b7280", marginBottom: 40, fontSize: 15 }}>
                Paste your code. Get instant complexity analysis.
            </p>

            <AnalysisForm
                onResult={(data) => {
                    setError(null);
                    setResult(data);
                }}
                onError={(msg) => {
                    setResult(null);
                    setError(msg);
                }}
            />

            {error && (
                <div
                    style={{
                        marginTop: 24,
                        padding: "16px 20px",
                        background: "#1f0707",
                        border: "1px solid #7f1d1d",
                        borderRadius: 8,
                        color: "#fca5a5",
                        fontSize: 14,
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {result && <AnalysisResult result={result} />}
        </main>
    );
}
