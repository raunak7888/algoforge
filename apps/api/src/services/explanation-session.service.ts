/**
 * Persistent AI explanation chat sessions.
 *
 * Flow for sendMessage:
 *   1. Load session from DB (or throw 404)
 *   2. Append user message to in-memory list
 *   3. Run AI pipeline (same as one-shot explain)
 *   4. Append assistant message
 *   5. Persist both to DB and bust session cache
 *
 * Sessions are shareable — makeSessionPublic generates a short shareId and
 * flips isPublic so anonymous readers can fetch via GET /api/share/explain/:shareId.
 *
 * Cache: each session is cached for 5 min (LRU + Redis).
 * The cache is busted on every write (sendMessage, share, delete).
 */
import { randomBytes } from "crypto";
import { explanationSessionRepository } from "../repositories/explanation-session.repository";
import { processQuery } from "../ai/query-processor";
import { buildCodebaseContext, serializeContext } from "../ai/context-builder";
import { buildExplanationPrompt } from "../prompts/explanation.prompt";
import { aiService } from "./ai.service";
import { AppError } from "../utils/app-error";
import { env } from "../config/env";
import type {
  CreateSessionInput,
  SendMessageInput,
  ListSessionsQuery,
} from "../validation/explanation-session";
import { layeredCache } from "./lib/Layered.cache";

// ─── Public types ─────────────────────────────────────────────────────────────

export type SessionMessage = {
  id:        string;   // 6-byte hex short id
  role:      "user" | "assistant";
  content:   string;
  intent?:   string;   // AI-detected intent, populated on assistant messages only
  createdAt: string;   // ISO 8601
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_CACHE_TTL_SECONDS = 300; // 5 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sessionCacheKey(id: string): string {
  return `explain:session:${id}`;
}

function newMessageId(): string {
  return randomBytes(6).toString("hex");
}

function newShareId(): string {
  return randomBytes(9).toString("base64url");
}

function buildShareUrl(shareId: string): string {
  return `${env.webAppUrl}/share/explain/${shareId}`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class ExplanationSessionService {
  // ─── Create ────────────────────────────────────────────────────────────────

  async createSession(userId: string, input: CreateSessionInput) {
    return explanationSessionRepository.create(userId, input.title);
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  async listSessions(userId: string, query: ListSessionsQuery) {
    const sessions = await explanationSessionRepository.findManyByUser(userId, {
      take:   query.limit,
      cursor: query.cursor,
    });

    // Return the last id as the next cursor so the client can paginate
    const nextCursor = sessions.length === query.limit
      ? (sessions[sessions.length - 1]?.id ?? null)
      : null;

    return { sessions, nextCursor };
  }

  // ─── Get by id (owner only) ────────────────────────────────────────────────

  async getSession(userId: string, id: string) {
    const cached = await layeredCache.get<
      Awaited<ReturnType<typeof explanationSessionRepository.findOneByUser>>
    >(sessionCacheKey(id));

    if (cached) return cached;

    const session = await explanationSessionRepository.findOneByUser(id, userId);
    if (!session) throw AppError.notFound("Session not found.");

    await layeredCache.set(sessionCacheKey(id), session, SESSION_CACHE_TTL_SECONDS);
    return session;
  }

  // ─── Send message ──────────────────────────────────────────────────────────

  async sendMessage(userId: string, sessionId: string, input: SendMessageInput) {
    // Always load from DB for writes to avoid stale-cache races
    const session = await explanationSessionRepository.findOneByUser(sessionId, userId);
    if (!session) throw AppError.notFound("Session not found.");

    const existingMessages = (session.messages as unknown as SessionMessage[]) ?? [];

    // 1. Build user message
    const userMessage: SessionMessage = {
      id:        newMessageId(),
      role:      "user",
      content:   input.query,
      createdAt: new Date().toISOString(),
    };

    // 2. Run AI pipeline — same steps as the one-shot endpoint
    const scope       = processQuery(input.query);
    const context     = await buildCodebaseContext(scope.targetSlugs);
    const contextText = serializeContext(context);
    const prompt      = buildExplanationPrompt(contextText, scope);
    const rawAnswer   = await aiService.generateText([{ role: "user", content: prompt }]);

    // 3. Build assistant message
    const assistantMessage: SessionMessage = {
      id:        newMessageId(),
      role:      "assistant",
      content:   rawAnswer.trim(),
      intent:    scope.intent,
      createdAt: new Date().toISOString(),
    };

    // 4. Persist; auto-set title from the first user query if not already set
    const updatedMessages = [...existingMessages, userMessage, assistantMessage];
    const title           = session.title ?? input.query.slice(0, 80);
    await explanationSessionRepository.appendMessages(sessionId, updatedMessages, title);

    // 5. Bust cache so the next getSession call reflects the new messages
    await layeredCache.del(sessionCacheKey(sessionId));

    return { userMessage, assistantMessage };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async deleteSession(userId: string, id: string): Promise<void> {
    const result = await explanationSessionRepository.delete(id, userId);
    if (result.count === 0) throw AppError.notFound("Session not found.");
    await layeredCache.del(sessionCacheKey(id));
  }

  // ─── Share (make public) ───────────────────────────────────────────────────

  async shareSession(userId: string, id: string) {
    const session = await explanationSessionRepository.findOneByUser(id, userId);
    if (!session) throw AppError.notFound("Session not found.");

    // Idempotent — return existing URL if already shared
    if (session.shareId && session.isPublic) {
      return { shareUrl: buildShareUrl(session.shareId) };
    }

    const shareId = newShareId();
    await explanationSessionRepository.share(id, shareId);
    await layeredCache.del(sessionCacheKey(id));

    return { shareUrl: buildShareUrl(shareId) };
  }

  // ─── Public read (no auth required) ───────────────────────────────────────

  async getPublicSession(shareId: string) {
    const cacheKey = `explain:public:${shareId}`;

    const cached = await layeredCache.get<
      Awaited<ReturnType<typeof explanationSessionRepository.findPublicByShareId>>
    >(cacheKey);
    if (cached) return cached;

    const session = await explanationSessionRepository.findPublicByShareId(shareId);
    if (!session) throw AppError.notFound("Session not found or not public.");

    // Public sessions can be cached longer — they don't change often
    await layeredCache.set(cacheKey, session, SESSION_CACHE_TTL_SECONDS * 2);
    return session;
  }
}

export const explanationSessionService = new ExplanationSessionService();