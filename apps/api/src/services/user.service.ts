//# filename: apps/api/src/services/user.service.ts

import { type SafeUser } from "@algoforge/analysis";
import { userRepository } from "../repositories/user.repository";
import { verifyAccessToken } from "../utils/token";
import { sessionRepository } from "../repositories/session.repository";

class UserService {
  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await userRepository.findPublicById(userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      username: user.username ?? user.name,
      avatarUrl: user.image,
    };
  }

  async getUserByToken(token: string): Promise<SafeUser | null> {
    try {
      const payload = verifyAccessToken(token);
      const session = await sessionRepository.findActiveById(
        payload.sessionId,
        payload.sub,
      );
      if (!session) return null;
      return this.getUserById(payload.sub);
    } catch {
      return null;
    }
  }
}

export const userService = new UserService();