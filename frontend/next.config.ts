import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't generate AGENTS.md / CLAUDE.md scaffolding files in the repo.
  agentRules: false,
};

export default nextConfig;
