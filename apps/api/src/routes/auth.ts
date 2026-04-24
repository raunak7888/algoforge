import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../utils/jwt";
import { prisma } from "@algoforge/db";

const router = Router();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
);

// Generate Google OAuth URL
router.get("/google", (req, res) => {
    const url = googleClient.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
    });

    res.json({ url });
});

// Google OAuth callback
router.post("/google/callback", async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ error: "Authorization code required" });
            return;
        }

        // Exchange code for tokens
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);

        // Get user info
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            res.status(400).json({ error: "Failed to get user info" });
            return;
        }

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email: payload.email },
            update: {
                name: payload.name || null,
                image: payload.picture || null,
            },
            create: {
                email: payload.email,
                name: payload.name || null,
                image: payload.picture || null,
            },
        });

        // Generate JWT
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
            },
        });
    } catch (error) {
        console.error("Auth error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "No token provided" });
            return;
        }

        const token = authHeader.substring(7);
        const { verifyToken } = await import("../utils/jwt");
        const payload = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

export default router;
