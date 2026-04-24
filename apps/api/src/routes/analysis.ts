import { Router, Request, Response } from "express";
import { prisma } from "@algoforge/db";

const analysisRouter = Router();

// Fake AI engine — deterministic results based on language
function generateFakeAnalysis(code: string, language: string) {
    const lineCount = code.split("\n").length;

    const complexityMap: Record<string, string> = {
        python: lineCount > 20 ? "O(n²)" : "O(n log n)",
        javascript: lineCount > 20 ? "O(n²)" : "O(n)",
        typescript: lineCount > 20 ? "O(n²)" : "O(n)",
        java: lineCount > 30 ? "O(n³)" : "O(n log n)",
        cpp: lineCount > 30 ? "O(n²)" : "O(log n)",
        go: "O(n)",
        rust: "O(log n)",
    };

    const suggestionMap: Record<string, string> = {
        python: "Consider using list comprehensions for better performance.",
        javascript:
            "Use const/let instead of var. Avoid implicit type coercions.",
        typescript: "Leverage strict mode and avoid 'any' types.",
        java: "Prefer StringBuilder over string concatenation in loops.",
        cpp: "Use RAII patterns and prefer std::vector over raw arrays.",
        go: "Leverage goroutines for concurrent operations.",
        rust: "Use iterators over explicit loops for zero-cost abstractions.",
    };

    const lang = language.toLowerCase();

    return {
        complexity: complexityMap[lang] ?? "O(n)",
        suggestion:
            suggestionMap[lang] ??
            "Review algorithm efficiency and data structure choices.",
        timeEstimate: `${Math.max(1, lineCount * 2)}ms`,
    };
}

analysisRouter.post("/", async (req: Request, res: Response) => {
    const { code, language } = req.body;

    // Validation
    if (!code || typeof code !== "string" || code.trim().length === 0) {
        return res
            .status(400)
            .json({ error: "code is required and must be a non-empty string" });
    }

    if (
        !language ||
        typeof language !== "string" ||
        language.trim().length === 0
    ) {
        return res
            .status(400)
            .json({
                error: "language is required and must be a non-empty string",
            });
    }

    try {
        const { complexity, suggestion, timeEstimate } = generateFakeAnalysis(
            code.trim(),
            language.trim(),
        );

        // Persist to DB
        const analysis = await prisma.analysis.create({
            data: {
                code: code.trim(),
                language: language.trim().toLowerCase(),
                complexity,
                suggestion,
                timeEstimate,
            },
        });

        return res.status(201).json({
            id: analysis.id,
            language: analysis.language,
            complexity: analysis.complexity,
            suggestion: analysis.suggestion,
            timeEstimate: analysis.timeEstimate,
            createdAt: analysis.createdAt,
        });
    } catch (err) {
        console.error("[Analysis Error]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET all analyses — useful for verifying DB persistence
analysisRouter.get("/", async (_req: Request, res: Response) => {
    try {
        const analyses = await prisma.analysis.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return res.json(analyses);
    } catch (err) {
        console.error("[Fetch Error]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export { analysisRouter };
