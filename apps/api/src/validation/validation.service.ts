import { Injectable } from "@nestjs/common";
import { ValidationResultSchema, type ValidationResult } from "@projectquote/schemas";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { computeEstimateTotals } from "../estimation/engine.js";

@Injectable()
export class ValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async validateProject(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);

    const estimate = await this.prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      include: { items: true },
    });

    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!estimate) {
      issues.push("No estimate found for this project");
      return this.persist(projectId, null, "BLOCKED", {
        issues,
        warnings,
        suggestions,
      });
    }

    for (const item of estimate.items) {
      if (item.priceSource === "ai_suggestion" && !item.confirmed) {
        issues.push(`Unconfirmed AI price: ${item.name}`);
      }
      if (new DecimalSafe(item.unitPrice).lte(0) && item.category !== "labour") {
        warnings.push(`Zero unit price: ${item.name}`);
      }
      if (new DecimalSafe(item.quantity).lte(0)) {
        issues.push(`Invalid quantity on line: ${item.name}`);
      }
    }

    const currency =
      ((estimate.totals as { currency?: string })?.currency ?? "INR") as string;
    const recomputed = computeEstimateTotals({
      currency,
      lineItems: estimate.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        labourHours: i.labourHours ?? undefined,
        labourRate: i.labourRate ?? undefined,
        discountPercent: i.discountPercent,
        taxPercent: i.taxPercent,
      })),
    });

    const storedGrand = (estimate.totals as { grandTotal?: string })?.grandTotal;
    if (storedGrand && storedGrand !== recomputed.grandTotal) {
      issues.push("Stored totals do not match estimation engine output");
    }

    if (warnings.length > 0) {
      suggestions.push("Review zero-priced lines or confirm catalog pricing");
    }

    const status =
      issues.length > 0 ? "BLOCKED" : warnings.length > 0 ? "WARNING" : "PASS";

    return this.persist(projectId, estimate.id, status, {
      issues,
      warnings,
      suggestions,
    });
  }

  assertNotBlocked(result: ValidationResult) {
    if (result.status === "BLOCKED") {
      const err = new Error("VALIDATION_BLOCKED");
      (err as Error & { details: ValidationResult }).details = result;
      throw err;
    }
  }

  private async persist(
    projectId: string,
    estimateId: string | null,
    status: "PASS" | "WARNING" | "BLOCKED",
    body: { issues: string[]; warnings: string[]; suggestions: string[] },
  ) {
    const payload = ValidationResultSchema.parse({
      status,
      ...body,
    });

    await this.prisma.validationResult.create({
      data: {
        projectId,
        estimateId,
        status,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (status !== "BLOCKED") {
      try {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
        });
        if (project) {
          await this.projects.transitionStatusBySystem(
            project.organizationId,
            projectId,
            "VALIDATION",
          );
        }
      } catch {
        /* ignore */
      }
    }

    return payload;
  }
}

class DecimalSafe {
  private readonly value: number;
  constructor(raw: string) {
    this.value = Number.parseFloat(raw);
  }
  lte(n: number) {
    return this.value <= n;
  }
}
