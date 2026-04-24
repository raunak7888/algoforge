import jwt from "jsonwebtoken";

const JWT_SECRET =
    process.env.JWT_SECRET || "4f92d86a213b7eef8c02138986a422187e462c1266e7f22312d8a6f212a4b891";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
    userId: string;
    email: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}
