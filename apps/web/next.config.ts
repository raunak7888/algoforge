import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@algoforge/analysis", "@algoforge/db"],
};

export default nextConfig;
