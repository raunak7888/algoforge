import { AuthProvider } from "@/context/Authcontext";
import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "AlgoForge",
    description: "Algorithm analyzer",
    icons: {
      icon: '/algoforge.png', // Point to a file in your public folder
    },

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
