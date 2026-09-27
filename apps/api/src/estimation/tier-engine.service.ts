import { Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Decimal from "decimal.js";

export type TierId = "basic" | "modern" | "premium";

type TierRules = Record<
  TierId,
  { priceUpliftPercent: string; warrantyMonths?: number }
>;

@Injectable()
export class TierEngineService {
  async loadTierRules(projectType: string): Promise<TierRules | null> {
    const root = this.resolveRepoRoot();
    const file = path.join(root, "config/project-types", `${projectType}.json`);
    if (!existsSync(file)) return null;
    const raw = JSON.parse(await readFile(file, "utf8")) as {
      tierRules?: TierRules;
    };
    return raw.tierRules ?? null;
  }

  applyUplift(unitPrice: string, upliftPercent: string): string {
    const base = new Decimal(unitPrice);
    const uplift = base.times(new Decimal(upliftPercent).div(100));
    return base.plus(uplift).toFixed(2);
  }

  private resolveRepoRoot(): string {
    const candidates = [
      process.cwd(),
      path.resolve(process.cwd(), ".."),
      path.resolve(process.cwd(), "../.."),
    ];
    for (const c of candidates) {
      if (existsSync(path.join(c, "config/project-types"))) return c;
    }
    return process.cwd();
  }
}
