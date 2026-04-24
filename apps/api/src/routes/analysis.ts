import { Router, Response } from "express";
import { prisma } from "@algoforge/db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * Fake AI analysis engine
 */
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
        python: "Use list comprehensions for better performance.",
        javascript: "Use const/let instead of var. Avoid implicit coercion.",
        typescript: "Enable strict mode and avoid 'any'.",
        java: "Use StringBuilder inside loops.",
        cpp: "Prefer std::vector over raw arrays.",
        go: "Use goroutines for concurrency.",
        rust: "Use iterators for zero-cost abstractions.",
    };

    const lang = language.toLowerCase();

    return {
        complexity: complexityMap[lang] ?? "O(n)",
        suggestion:
            suggestionMap[lang] ??
            "Improve algorithm and data structure usage.",
        timeEstimate: `${Math.max(1, lineCount * 2)}ms`,
        lineCount,
    };
}

/**
 * POST /analysis
 * Protected route
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code, language } = req.body;

        // Validation
        if (!code || typeof code !== "string" || code.trim().length === 0) {
            return res
                .status(400)
                .json({ error: "Code must be a non-empty string" });
        }

        if (
            !language ||
            typeof language !== "string" ||
            language.trim().length === 0
        ) {
            return res
                .status(400)
                .json({ error: "Language must be a non-empty string" });
        }

        const cleanCode = code.trim();
        const cleanLang = language.trim().toLowerCase();

        // Generate analysis
        const { complexity, suggestion, timeEstimate, lineCount } =
            generateFakeAnalysis(cleanCode, cleanLang);

        // Store in DB (with user relation)
        const analysis = await prisma.analysis.create({
            data: {
                code: cleanCode,
                language: cleanLang,
                complexity,
                suggestion,
                timeEstimate,
                result: {
                    lineCount,
                    complexity,
                    timeEstimate,
                    timestamp: new Date().toISOString(),
                },
                userId: req.user!.userId,
            },
            select: {
                id: true,
                language: true,
                complexity: true,
                suggestion: true,
                timeEstimate: true,
                result: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return res.status(201).json({
            id: analysis.id,
            language: analysis.language,
            complexity: analysis.complexity,
            suggestion: analysis.suggestion,
            timeEstimate: analysis.timeEstimate,
            result: analysis.result,
            createdAt: analysis.createdAt,
            user: analysis.user,
        });
    } catch (err) {
        console.error("[Analysis Error]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /analysis
 * Get logged-in user's analyses
 */
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const analyses = await prisma.analysis.findMany({
            where: {
                userId: req.user!.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                language: true,
                complexity: true,
                suggestion: true,
                timeEstimate: true,
                result: true,
                createdAt: true,
            },
        });

        return res.json({ analyses });
    } catch (err) {
        console.error("[Fetch Error]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;