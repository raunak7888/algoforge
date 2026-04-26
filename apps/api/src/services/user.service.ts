import { prisma } from "@algoforge/db";
import { type SafeUser } from "@algoforge/analysis";
import { verifyAccessToken } from "../utils/token";

class UserService {
  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await (prisma.user.findUnique as any)({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      username: user.username || user.name,
      avatarUrl: user.image,
    };
  }

  async getUserByToken(token: string): Promise<SafeUser | null> {
    try {
      const payload = verifyAccessToken(token);
      
      // Also verify session exists and is active
      const session = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) return null;

      return this.getUserById(payload.sub);
    } catch (error) {
      return null;
    }
  }
}

export const userService = new UserService();
