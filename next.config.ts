import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["playwright", "pdf-parse", "mammoth"],
};

export default nextConfig;
