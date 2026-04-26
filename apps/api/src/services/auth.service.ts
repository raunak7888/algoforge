import { OAuth2Client } from "google-auth-library";
import { Role, prisma } from "@algoforge/db";
import { env, googleOAuthConfig } from "../config/env";
import { AppError } from "../utils/app-error";
import { hashToken, randomToken, safeTokenEquals } from "../utils/crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/token";

type RequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
};

type SessionCookies = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

type AuthResult = SessionCookies & {
  user: AuthenticatedUser;
};

const googleClient = new OAuth2Client(
  env.googleClientId,
  env.googleClientSecret,
  googleOAuthConfig.redirectUri,
);

const userSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  image: true,
  role: true,
} as const;

class AuthService {
  buildGoogleAuthorizationUrl(): { url: string; state: string } {
    const state = randomToken(32);
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: googleOAuthConfig.scopes,
      include_granted_scopes: true,
      state,
      prompt: "select_account",
    });

    return { url, state };
  }

  async authenticateGoogleCallback(
    code: string,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      throw AppError.unauthorized("Google did not return an ID token.");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub) {
      throw AppError.unauthorized("Google account data is invalid.");
    }

    const user = await this.findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: payload.sub,
      email: payload.email_verified ? payload.email ?? null : null,
      name: payload.name ?? null,
      image: payload.picture ?? null,
    });

    return this.createSessionForUser(user, metadata);
  }

  async authenticateAccessToken(accessToken: string) {
    const payload = verifyAccessToken(accessToken);

    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: userSelect,
        },
      },
    });

    if (!session) {
      throw AppError.unauthorized("Session is invalid.");
    }

    return {
      user: session.user,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const payload = verifyRefreshToken(refreshToken);
    const presentedTokenHash = hashToken(refreshToken);
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: { select: userSelect },
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw AppError.unauthorized("Refresh session is invalid.");
    }

    if (!safeTokenEquals(presentedTokenHash, session.tokenHash)) {
      throw AppError.unauthorized("Refresh token is invalid.");
    }

    if (session.revokedAt) {
      await this.revokeAllUserSessions(session.userId);
      throw AppError.unauthorized("Refresh token reuse detected.");
    }

    if (session.expiresAt <= new Date()) {
      await this.revokeSession(session.id);
      throw AppError.unauthorized("Refresh token expired.");
    }

    const rotatedSession = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const revocation = await tx.session.updateMany({
        where: {
          id: session.id,
          userId: session.userId,
          tokenHash: presentedTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
          lastUsedAt: now,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      if (revocation.count !== 1) {
        throw AppError.unauthorized("Refresh token reuse detected.");
      }

      const nextRefreshToken = signRefreshToken({
        sub: session.user.id,
        sessionId: randomToken(24),
      });

      const nextSessionId = verifyRefreshToken(nextRefreshToken).sessionId;
      const nextSession = await tx.session.create({
        data: {
          id: nextSessionId,
          userId: session.user.id,
          tokenHash: hashToken(nextRefreshToken),
          expiresAt: this.buildRefreshExpiry(),
          lastUsedAt: now,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          rotatedFromId: session.id,
        },
      });

      return {
        session: nextSession,
        refreshToken: nextRefreshToken,
      };
    }).catch(async (error) => {
      if (error instanceof AppError && error.message === "Refresh token reuse detected.") {
        await this.revokeAllUserSessions(session.userId);
      }

      throw error;
    });

    const accessToken = signAccessToken({
      sub: session.user.id,
      sessionId: rotatedSession.session.id,
      role: session.user.role,
    });

    return {
      accessToken,
      refreshToken: rotatedSession.refreshToken,
      csrfToken: randomToken(24),
      user: session.user,
    };
  }

  async revokeSessionByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await this.revokeSession(payload.sessionId, payload.sub);
    } catch {
      return;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async createSessionForUser(
    user: AuthenticatedUser,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const refreshToken = signRefreshToken({
      sub: user.id,
      sessionId: randomToken(24),
    });
    const refreshPayload = verifyRefreshToken(refreshToken);

    await prisma.session.create({
      data: {
        id: refreshPayload.sessionId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: this.buildRefreshExpiry(),
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      sessionId: refreshPayload.sessionId,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      csrfToken: randomToken(24),
      user,
    };
  }

  private buildRefreshExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.refreshTokenTtlDays);
    return expiresAt;
  }

  private async revokeSession(sessionId: string, userId?: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        ...(userId ? { userId } : {}),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async findOrCreateOAuthUser(input: {
    provider: string;
    providerAccountId: string;
    email: string | null;
    name: string | null;
    image: string | null;
  }): Promise<AuthenticatedUser> {
    return prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
        include: {
          user: {
            select: userSelect,
          },
        },
      });

      if (existingAccount) {
        const updatedUser = await tx.user.update({
          where: { id: existingAccount.userId },
          data: {
            email: input.email ?? existingAccount.user.email,
            name: input.name,
            image: input.image,
          },
          select: userSelect,
        });

        return updatedUser;
      }

      const existingUser =
        input.email !== null
          ? await tx.user.findUnique({
              where: { email: input.email },
              select: userSelect,
            })
          : null;

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: input.email,
            role: Role.USER,
            name: input.name,
            image: input.image,
          },
          select: userSelect,
        }));

      await tx.account.create({
        data: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          userId: user.id,
        },
      });

      if (existingUser) {
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: input.name,
            image: input.image,
          },
          select: userSelect,
        });
      }

      return user;
    });
  }
}

export const authService = new AuthService();
