import { OAuth2Client } from "google-auth-library";
import { Role } from "@algoforge/db";
import { prisma } from "@algoforge/db";
import { env, googleOAuthConfig } from "../config/env";
import { sessionRepository } from "../repositories/session.repository";
import { userRepository } from "../repositories/user.repository";
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
  id:       string;
  email:    string | null;
  username: string | null;
  name:     string | null;
  image:    string | null;
  role:     Role;
};

type SessionCookies = {
  accessToken:  string;
  refreshToken: string;
  csrfToken:    string;
};

type AuthResult = SessionCookies & { user: AuthenticatedUser };

const googleClient = new OAuth2Client(
  env.googleClientId,
  env.googleClientSecret,
  googleOAuthConfig.redirectUri,
);

class AuthService {
  buildGoogleAuthorizationUrl(): { url: string; state: string } {
    const state = randomToken(32);
    const url = googleClient.generateAuthUrl({
      access_type:             "offline",
      scope:                   googleOAuthConfig.scopes,
      include_granted_scopes:  true,
      state,
      prompt:                  "select_account",
    });
    return { url, state };
  }

  async authenticateGoogleCallback(
    code: string,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) throw AppError.unauthorized("Google did not return an ID token.");

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw AppError.unauthorized("Google account data is invalid.");

    const user = await this.findOrCreateOAuthUser({
      provider:          "google",
      providerAccountId: payload.sub,
      email:             payload.email_verified ? (payload.email ?? null) : null,
      name:              payload.name ?? null,
      image:             payload.picture ?? null,
    });

    return this.createSessionForUser(user, metadata);
  }

  async authenticateAccessToken(accessToken: string) {
    const payload = verifyAccessToken(accessToken);

    const session = await sessionRepository.findActiveById(
      payload.sessionId,
      payload.sub,
    );

    if (!session) throw AppError.unauthorized("Session is invalid.");

    return {
      user:    session.user,
      session: { id: session.id, expiresAt: session.expiresAt },
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const payload       = verifyRefreshToken(refreshToken);
    const presentedHash = hashToken(refreshToken);

    const session = await sessionRepository.findByIdWithUser(payload.sessionId);

    if (!session || session.userId !== payload.sub) {
      throw AppError.unauthorized("Refresh session is invalid.");
    }

    if (!safeTokenEquals(presentedHash, session.tokenHash)) {
      throw AppError.unauthorized("Refresh token is invalid.");
    }

    if (session.revokedAt) {
      await this.revokeAllUserSessions(session.userId);
      throw AppError.unauthorized("Refresh token reuse detected.");
    }

    if (session.expiresAt <= new Date()) {
      await sessionRepository.revokeById(session.id);
      throw AppError.unauthorized("Refresh token expired.");
    }

    // Generate the next session id directly — no need to sign+verify just to
    // extract back the same value we passed in.
    const nextSessionId    = randomToken(24);
    const nextRefreshToken = signRefreshToken({ sub: session.user.id, sessionId: nextSessionId });

    const rotated = await sessionRepository.rotate(
      session.id,
      session.userId,
      presentedHash,
      {
        id:          nextSessionId,
        tokenHash:   hashToken(nextRefreshToken),
        expiresAt:   this.buildRefreshExpiry(),
        lastUsedAt:  new Date(),
        ipAddress:   metadata.ipAddress,
        userAgent:   metadata.userAgent,
      },
    );

    if (!rotated) {
      await this.revokeAllUserSessions(session.userId);
      throw AppError.unauthorized("Refresh token reuse detected.");
    }

    const accessToken = signAccessToken({
      sub:       session.user.id,
      sessionId: nextSessionId,
      role:      session.user.role,
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      csrfToken:    randomToken(24),
      user:         session.user,
    };
  }

  async revokeSessionByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await sessionRepository.revokeById(payload.sessionId, payload.sub);
    } catch {
      return;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await sessionRepository.revokeAllForUser(userId);
  }

  private async createSessionForUser(
    user: AuthenticatedUser,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    // Generate the session id directly — no round-trip sign+verify needed.
    const sessionId    = randomToken(24);
    const refreshToken = signRefreshToken({ sub: user.id, sessionId });

    await sessionRepository.create({
      id:          sessionId,
      userId:      user.id,
      tokenHash:   hashToken(refreshToken),
      expiresAt:   this.buildRefreshExpiry(),
      lastUsedAt:  new Date(),
      ipAddress:   metadata.ipAddress,
      userAgent:   metadata.userAgent,
    });

    const accessToken = signAccessToken({
      sub:       user.id,
      sessionId,
      role:      user.role,
    });

    return { accessToken, refreshToken, csrfToken: randomToken(24), user };
  }

  private buildRefreshExpiry(): Date {
    const d = new Date();
    d.setDate(d.getDate() + env.refreshTokenTtlDays);
    return d;
  }

  private async findOrCreateOAuthUser(input: {
    provider:          string;
    providerAccountId: string;
    email:             string | null;
    name:              string | null;
    image:             string | null;
  }): Promise<AuthenticatedUser> {
    return prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider:          input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
        include: {
          user: {
            select: {
              id:       true,
              email:    true,
              username: true,
              name:     true,
              image:    true,
              role:     true,
            },
          },
        },
      });

      if (existingAccount) {
        return tx.user.update({
          where: { id: existingAccount.userId },
          data: {
            email: input.email ?? existingAccount.user.email,
            name:  input.name,
            image: input.image,
          },
          select: {
            id:       true,
            email:    true,
            username: true,
            name:     true,
            image:    true,
            role:     true,
          },
        });
      }

      const existingUser =
        input.email !== null
          ? await tx.user.findUnique({
              where: { email: input.email },
              select: {
                id:       true,
                email:    true,
                username: true,
                name:     true,
                image:    true,
                role:     true,
              },
            })
          : null;

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: input.email,
            role:  Role.USER,
            name:  input.name,
            image: input.image,
          },
          select: {
            id:       true,
            email:    true,
            username: true,
            name:     true,
            image:    true,
            role:     true,
          },
        }));

      await tx.account.create({
        data: {
          provider:          input.provider,
          providerAccountId: input.providerAccountId,
          userId:            user.id,
        },
      });

      if (existingUser) {
        return tx.user.update({
          where: { id: existingUser.id },
          data:  { name: input.name, image: input.image },
          select: {
            id:       true,
            email:    true,
            username: true,
            name:     true,
            image:    true,
            role:     true,
          },
        });
      }

      return user;
    });
  }
}

export const authService = new AuthService();