import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project; a stray lockfile higher up (e.g. in the home folder)
  // would otherwise be picked as the root.
  outputFileTracingRoot: path.resolve(__dirname),
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/login", destination: "/signin", permanent: true },
      { source: "/track/overview", destination: "/track", permanent: false },
      { source: "/track/history", destination: "/track/insights", permanent: false },
      { source: "/you/edit-profile", destination: "/you/personal-details", permanent: false },
      { source: "/track/log-meal", destination: "/track?log=meal", permanent: false },
      { source: "/track/log-meal/custom", destination: "/track?log=macros", permanent: false },
      { source: "/track/water", destination: "/track?log=water", permanent: false },
      { source: "/track/weight", destination: "/track?log=weight", permanent: false },
      { source: "/track/activity", destination: "/track?log=activity", permanent: false },
      { source: "/track/activity/custom", destination: "/track?log=activity", permanent: false },
      { source: "/cook/search", destination: "/search?scope=recipes", permanent: false },
    ];
  },
};

export default nextConfig;
