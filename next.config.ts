import type { NextConfig } from "next";
module.exports = {
  reactStrictMode: true,
};
const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  experimental: {
    reactRefresh: true,
  },
  allowImportingTsExtensions: true,
};

export default nextConfig;
