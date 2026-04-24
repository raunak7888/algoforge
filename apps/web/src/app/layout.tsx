import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AlgoForge",
  description: "Algorithm complexity analyzer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f0f0f", color: "#e0e0e0" }}>
        {children}
      </body>
    </html>
  );
}
