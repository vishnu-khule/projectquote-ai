import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

const rootEnv = path.resolve(__dirname, "../../.env");
if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@projectquote/schemas"],
  output: "standalone",
};

export default nextConfig;
