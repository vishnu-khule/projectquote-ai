import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@projectquote/schemas"],
};

export default nextConfig;
