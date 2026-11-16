import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages moved into the five stages. Old links keep working.
  async redirects() {
    return [
      { source: "/product-board", destination: "/discover", permanent: false },
      { source: "/product-board/problem", destination: "/discover/report#customers", permanent: false },
      { source: "/product-board/market", destination: "/discover/report#market", permanent: false },
      { source: "/product-board/solution", destination: "/define/report#solution", permanent: false },
      { source: "/product-board/business-model", destination: "/define/report#business-model", permanent: false },
      { source: "/product-board/risks", destination: "/define/report#risks", permanent: false },
      // Discover and Define pages became sections of each stage's report.
      { source: "/discover/customers", destination: "/discover/report#customers", permanent: false },
      { source: "/discover/market", destination: "/discover/report#market", permanent: false },
      { source: "/define/solution", destination: "/define/report#solution", permanent: false },
      { source: "/define/business-model", destination: "/define/report#business-model", permanent: false },
      { source: "/define/targets", destination: "/define/report#targets", permanent: false },
      { source: "/define/risks", destination: "/define/report#risks", permanent: false },
      { source: "/tasks", destination: "/design/experiments", permanent: false },
      { source: "/storymap", destination: "/develop/story-map", permanent: false },
      { source: "/storymap/release", destination: "/develop/delivery-plan", permanent: false },
      { source: "/metrics", destination: "/deploy/metrics", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
    ],
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
