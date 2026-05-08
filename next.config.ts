import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "pdf-parse", "mammoth"],
};

export default nextConfig;
