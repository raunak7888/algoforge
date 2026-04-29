//# filename: apps/api/src/repositories/session.repository.ts

import { prisma } from "@algoforge/db";

const userSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  image: true,
  role: true,
} as const;

export const sessionRepository = {
  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    lastUsedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    rotatedFromId?: string;
  }) {
    return prisma.session.create({ data });
  },

  findActiveById(sessionId: string, userId: string) {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        expiresAt: true,
        user: { select: userSelect },
      },
    });
  },

  findByIdWithUser(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: userSelect } },
    });
  },

  /**
   * Atomically revokes the current session and creates a rotated replacement.
   * Returns null if the session could not be exclusively revoked (reuse detected).
   */
  async rotate(
    currentId: string,
    currentUserId: string,
    currentTokenHash: string,
    next: {
      id: string;
      tokenHash: string;
      expiresAt: Date;
      lastUsedAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    },
  ) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const revoked = await tx.session.updateMany({
        where: {
          id: currentId,
          userId: currentUserId,
          tokenHash: currentTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now, lastUsedAt: now },
      });

      if (revoked.count !== 1) return null;

      return tx.session.create({
        data: {
          ...next,
          userId: currentUserId,
          rotatedFromId: currentId,
        },
      });
    });
  },

  revokeById(sessionId: string, userId?: string) {
    return prisma.session.updateMany({
      where: { id: sessionId, ...(userId ? { userId } : {}), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllForUser(userId: string) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};