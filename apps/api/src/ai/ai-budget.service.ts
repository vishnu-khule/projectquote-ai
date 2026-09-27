import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AiBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  private capCents(): number {
    const raw = process.env.AI_MONTHLY_BUDGET_CAP_CENTS ?? "0";
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /** Rough USD spend from token usage (1 cent ≈ 10k tokens heuristic). */
  private estimateSpendCents(
    inputTokens: number,
    outputTokens: number,
  ): number {
    const total = inputTokens + outputTokens;
    return Math.ceil(total / 10000);
  }

  async assertWithinBudget(orgId: string) {
    const cap = this.capCents();
    if (cap === 0) return;

    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const runs = await this.prisma.aiRun.findMany({
      where: {
        project: { organizationId: orgId },
        createdAt: { gte: start },
      },
      select: { inputTokens: true, outputTokens: true },
    });

    let spent = 0;
    for (const run of runs) {
      spent += this.estimateSpendCents(
        run.inputTokens ?? 0,
        run.outputTokens ?? 0,
      );
    }
    if (spent >= cap) {
      throw new HttpException(
        "Monthly AI usage cap reached for this organization",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  spendEstimateCents(inputTokens: number, outputTokens: number): number {
    return this.estimateSpendCents(inputTokens, outputTokens);
  }
}
