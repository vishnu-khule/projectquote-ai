import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

function findEnvFile(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const envPath = path.join(dir, ".env");
    if (existsSync(envPath)) {
      return envPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

const envPath = findEnvFile();
if (envPath) {
  config({ path: envPath, override: true });
}
