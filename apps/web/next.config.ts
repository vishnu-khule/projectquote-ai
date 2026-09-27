import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@projectquote/schemas"],
  output: "standalone",
};

export default nextConfig;
