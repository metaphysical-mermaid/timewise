import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@timewise/core"],
  agentRules: false,
};

export default nextConfig;
