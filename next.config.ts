import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'https://karting-league-admin-portal.vercel.app',
      'imgs.search.brave.com'
    ],
  },
};

export default nextConfig;
