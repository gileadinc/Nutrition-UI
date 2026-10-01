import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/track/overview", destination: "/track", permanent: false },
      { source: "/track/history", destination: "/track/insights", permanent: false },
      { source: "/you/edit-profile", destination: "/you/personal-details", permanent: false },
      {
        source: "/you/goal",
        destination: "/questionnaire?step=goal&returnTo=%2Fyou",
        permanent: false,
      },
      {
        source: "/you/activity-level",
        destination: "/questionnaire?step=activity&returnTo=%2Fyou",
        permanent: false,
      },
      { source: "/cook/search", destination: "/search?scope=recipes", permanent: false },
    ];
  },
};

export default nextConfig;
