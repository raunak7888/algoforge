import { AuthProvider } from "@/context/Authcontext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AlgoForge",
    description: "Algorithm analyzer",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
