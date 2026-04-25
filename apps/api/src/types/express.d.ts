import { Role } from "@algoforge/db";

type AnalysisResult = {
  summary: string;

  complexity: {
    time: {
      best: string;
      average: string;
      worst: string;
    };
    space: string;
  };

  breakdown: {
    approach: string;
    steps: string[];
  };

  bottlenecks: {
    issue: string;
    impact: string;
    location?: string;
  }[];

  antiPatterns: string[];

  improvements: {
    suggestion: string;
    expectedImpact: string;
  }[];

  optimizedCode: string;

  comparison?: {
    originalVsOptimized: string;
    improvementSummary: string;
  };

  edgeCases: string[];

  readabilityScore?: number;

  tags?: string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: {
          id: string;
          email: string | null;
          name: string | null;
          image: string | null;
          role: Role;
        };
        session: {
          id: string;
          expiresAt: Date;
        };
      };
      analysisResult?: AnalysisResult;
    }
  }
}

export {};