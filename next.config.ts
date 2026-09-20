import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@coinbase/cdp-sdk",
    "@base-org/account",
  ],
};

export default nextConfig;