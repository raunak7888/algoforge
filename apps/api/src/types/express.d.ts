import { Role } from "@algoforge/db";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: {
          id:       string;
          email:    string | null;
          username: string | null;
          name:     string | null;
          image:    string | null;
          role:     Role;
        };
        session: {
          id:        string;
          expiresAt: Date;
        };
      };
      // Set by requireAdminSecret middleware when the X-Admin-Secret header
      // is valid. Allows the admin endpoint without a user JWT.
      adminViaSecret?: true;
    }
  }
}

export {};