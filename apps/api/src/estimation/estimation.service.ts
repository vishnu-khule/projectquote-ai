import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { computeEstimateTotals } from "./engine.js";
import type { LineItemInput } from "./estimation.schemas.js";
import { TierEngineService, type TierId } from "./tier-engine.service.js";

@Injectable()
export class EstimationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly tierEngine: TierEngineService,
  ) {}

  async getLatest(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    const estimate = await this.prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      include: { items: true },
    });
    if (!estimate) {
      return null;
    }
    return this.toDto(estimate);
  }

  async generateDraft(orgId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { organization: true },
    });
    if (!project || project.organizationId !== orgId) {
      throw new NotFoundException("Project not found");
    }

    const existing = await this.prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });
    if (existing) {
      return this.getLatest(orgId, projectId);
    }

    const requirements = (project.requirements ?? {}) as Record<string, unknown>;
    const defaultTax = project.organization.defaultTaxPercent ?? "18";
    const lineItems = this.buildSuggestedLines(
      project,
      requirements,
      defaultTax,
    );
    const currency = project.organization.currency ?? "INR";

    const totals = computeEstimateTotals({
      currency,
      lineItems: lineItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        labourHours: item.labourHours,
        labourRate: item.labourRate,
        discountPercent: item.discountPercent ?? "0",
        taxPercent: item.taxPercent ?? defaultTax,
      })),
    });

    const estimate = await this.prisma.estimate.create({
      data: {
        projectId,
        version: 1,
        tier: "single",
        totals: totals as Prisma.InputJsonValue,
        items: {
          create: lineItems.map((item) => ({
            id: item.id ?? randomUUID(),
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            labourHours: item.labourHours ?? null,
            labourRate: item.labourRate ?? null,
            discountPercent: item.discountPercent ?? "0",
            taxPercent: item.taxPercent ?? defaultTax,
            priceSource: item.priceSource ?? "ai_suggestion",
            confirmed: item.confirmed ?? false,
          })),
        },
      },
      include: { items: true },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        projectId,
        "ESTIMATION_GENERATED",
      );
    } catch {
      /* ignore */
    }

    return this.toDto(estimate);
  }

  async replaceLineItems(
    orgId: string,
    estimateId: string,
    lineItems: LineItemInput[],
  ) {
    const estimate = await this.findEstimateForOrg(orgId, estimateId);
    const currency = ((estimate.totals as { currency?: string })?.currency ??
      "INR") as string;

    await this.prisma.$transaction(async (tx) => {
      await tx.estimateItem.deleteMany({ where: { estimateId } });
      await tx.estimateItem.createMany({
        data: lineItems.map((item) => this.toItemRow(estimateId, item)),
      });
      const totals = await this.computeAndSaveTotals(tx, estimateId, currency);
      await tx.estimate.update({
        where: { id: estimateId },
        data: { totals: totals as Prisma.InputJsonValue },
      });
    });

    return this.getEstimateById(orgId, estimateId);
  }

  async addLineItem(orgId: string, estimateId: string, item: LineItemInput) {
    const estimate = await this.findEstimateForOrg(orgId, estimateId);
    await this.prisma.estimateItem.create({
      data: this.toItemRow(estimateId, item),
    });
    await this.recomputeTotals(estimateId, estimate);
    return this.getEstimateById(orgId, estimateId);
  }

  async addLineItemFromCatalog(
    orgId: string,
    estimateId: string,
    catalogItemId: string,
    quantity: string,
  ) {
    const catalogItem = await this.prisma.priceCatalogItem.findFirst({
      where: { id: catalogItemId, organizationId: orgId },
    });
    if (!catalogItem) {
      throw new NotFoundException("Catalog item not found");
    }

    const line: LineItemInput =
      catalogItem.kind === "labour"
        ? {
            name: catalogItem.name,
            category: catalogItem.category,
            quantity,
            unit: catalogItem.unit,
            unitPrice: "0",
            labourHours: quantity,
            labourRate: catalogItem.unitPrice,
            discountPercent: "0",
            taxPercent: catalogItem.taxPercent,
            priceSource: "catalog",
            confirmed: true,
          }
        : {
            name: catalogItem.name,
            category: catalogItem.category,
            quantity,
            unit: catalogItem.unit,
            unitPrice: catalogItem.unitPrice,
            discountPercent: "0",
            taxPercent: catalogItem.taxPercent,
            priceSource: "catalog",
            confirmed: true,
          };

    return this.addLineItem(orgId, estimateId, line);
  }

  async updateLineItem(
    orgId: string,
    estimateId: string,
    itemId: string,
    patch: Partial<LineItemInput>,
  ) {
    await this.findEstimateForOrg(orgId, estimateId);
    const existing = await this.prisma.estimateItem.findFirst({
      where: { id: itemId, estimateId },
    });
    if (!existing) {
      throw new NotFoundException("Line item not found");
    }

    const priceSource = patch.priceSource ?? existing.priceSource;
    let confirmed = patch.confirmed ?? existing.confirmed;
    if (
      patch.unitPrice !== undefined &&
      patch.unitPrice !== existing.unitPrice &&
      priceSource === "ai_suggestion"
    ) {
      confirmed = false;
    }

    await this.prisma.estimateItem.update({
      where: { id: itemId },
      data: {
        name: patch.name,
        category: patch.category,
        quantity: patch.quantity,
        unit: patch.unit,
        unitPrice: patch.unitPrice,
        labourHours: patch.labourHours,
        labourRate: patch.labourRate,
        discountPercent: patch.discountPercent,
        taxPercent: patch.taxPercent,
        priceSource,
        confirmed,
      },
    });

    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
    });
    if (estimate) {
      await this.recomputeTotals(estimateId, estimate);
    }
    return this.getEstimateById(orgId, estimateId);
  }

  async deleteLineItem(orgId: string, estimateId: string, itemId: string) {
    const estimate = await this.findEstimateForOrg(orgId, estimateId);
    const count = await this.prisma.estimateItem.count({
      where: { estimateId },
    });
    if (count <= 1) {
      throw new BadRequestException("Estimate must have at least one line item");
    }
    await this.prisma.estimateItem.delete({ where: { id: itemId } });
    await this.recomputeTotals(estimateId, estimate);
    return this.getEstimateById(orgId, estimateId);
  }

  async confirmLineItem(orgId: string, estimateId: string, itemId: string) {
    await this.findEstimateForOrg(orgId, estimateId);
    const item = await this.prisma.estimateItem.findFirst({
      where: { id: itemId, estimateId },
    });
    if (!item) {
      throw new NotFoundException("Line item not found");
    }
    await this.prisma.estimateItem.update({
      where: { id: itemId },
      data: {
        confirmed: true,
        priceSource: item.priceSource === "ai_suggestion" ? "user" : item.priceSource,
      },
    });
    return this.getEstimateById(orgId, estimateId);
  }

  async listTierEstimates(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    const estimates = await this.prisma.estimate.findMany({
      where: {
        projectId,
        tier: { in: ["basic", "modern", "premium"] },
      },
      include: { items: true },
      orderBy: { tier: "asc" },
    });
    return estimates.map((e) => this.toDto(e));
  }

  async generateTierPackages(orgId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { organization: true },
    });
    if (!project || project.organizationId !== orgId) {
      throw new NotFoundException("Project not found");
    }

    const base = await this.prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      include: { items: true },
    });
    if (!base || base.items.length === 0) {
      throw new BadRequestException("Create a base estimate first");
    }

    const rules = await this.tierEngine.loadTierRules(project.projectType);
    if (!rules) {
      throw new BadRequestException("No tier rules for this project type");
    }

    const tiers: TierId[] = ["basic", "modern", "premium"];
    const currency =
      ((base.totals as { currency?: string })?.currency ??
        project.organization.currency) as string;

    await this.prisma.estimate.deleteMany({
      where: {
        projectId,
        tier: { in: tiers },
      },
    });

    const created = [];
    for (const tier of tiers) {
      const uplift = rules[tier].priceUpliftPercent;
      const lineRows = base.items.map((item) => ({
        id: randomUUID(),
        estimateId: "",
        name:
          tier === "basic"
            ? item.name
            : `${item.name} (${tier} package)`,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: this.tierEngine.applyUplift(item.unitPrice, uplift),
        labourHours: item.labourHours,
        labourRate: item.labourRate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        priceSource: item.priceSource,
        confirmed: item.confirmed,
      }));

      const totals = computeEstimateTotals({
        currency,
        lineItems: lineRows.map((r) => ({
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          labourHours: r.labourHours ?? undefined,
          labourRate: r.labourRate ?? undefined,
          discountPercent: r.discountPercent,
          taxPercent: r.taxPercent,
        })),
      });

      const estimate = await this.prisma.estimate.create({
        data: {
          projectId,
          version: base.version,
          tier,
          totals: totals as Prisma.InputJsonValue,
          items: {
            create: lineRows.map(({ estimateId: _, ...row }) => row),
          },
        },
        include: { items: true },
      });
      created.push(this.toDto(estimate));
    }

    return { tiers: created, rules };
  }

  private buildSuggestedLines(
    project: {
      projectType: string;
      title: string;
      location: string | null;
    },
    requirements: Record<string, unknown>,
    defaultTaxPercent = "18",
  ): LineItemInput[] {
    const taxPercent = defaultTaxPercent;
    const discountPercent = "0";
    const lines: LineItemInput[] = [
      {
        name: "Materials package",
        category: "material",
        quantity: "1",
        unit: "lot",
        unitPrice: "0",
        discountPercent,
        taxPercent,
        priceSource: "ai_suggestion",
        confirmed: false,
      },
      {
        name: "Labour & installation",
        category: "labour",
        quantity: "1",
        unit: "lot",
        unitPrice: "0",
        labourHours: "8",
        labourRate: "500",
        discountPercent,
        taxPercent,
        priceSource: "ai_suggestion",
        confirmed: false,
      },
    ];

    if (project.projectType.includes("kitchen")) {
      lines.unshift({
        name: "Modular kitchen carcass & shutters",
        category: "carcass",
        quantity: "1",
        unit: "set",
        unitPrice: "0",
        discountPercent,
        taxPercent,
        priceSource: "ai_suggestion",
        confirmed: false,
      });
    }

    const missing = requirements._missingInformation;
    if (Array.isArray(missing) && missing.length > 0) {
      lines[0].name = `${lines[0].name} (review scope)`;
    }

    return lines;
  }

  private async findEstimateForOrg(orgId: string, estimateId: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { project: true, items: true },
    });
    if (!estimate || estimate.project.organizationId !== orgId) {
      throw new NotFoundException("Estimate not found");
    }
    return estimate;
  }

  private async getEstimateById(orgId: string, estimateId: string) {
    const estimate = await this.findEstimateForOrg(orgId, estimateId);
    return this.toDto(estimate);
  }

  private toItemRow(estimateId: string, item: LineItemInput) {
    const isAi = item.priceSource === "ai_suggestion";
    return {
      id: item.id ?? randomUUID(),
      estimateId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      labourHours: item.labourHours ?? null,
      labourRate: item.labourRate ?? null,
      discountPercent: item.discountPercent ?? "0",
      taxPercent: item.taxPercent ?? "18",
      priceSource: item.priceSource ?? "user",
      confirmed: item.confirmed ?? !isAi,
    };
  }

  private async recomputeTotals(
    estimateId: string,
    estimate: { totals: unknown },
  ) {
    const currency =
      ((estimate.totals as { currency?: string })?.currency ?? "INR") as string;
    await this.computeAndSaveTotals(this.prisma, estimateId, currency);
  }

  private async computeAndSaveTotals(
    tx: Prisma.TransactionClient | PrismaService,
    estimateId: string,
    currency: string,
  ) {
    const items = await tx.estimateItem.findMany({ where: { estimateId } });
    const totals = computeEstimateTotals({
      currency,
      lineItems: items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        labourHours: item.labourHours ?? undefined,
        labourRate: item.labourRate ?? undefined,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      })),
    });
    await tx.estimate.update({
      where: { id: estimateId },
      data: { totals: totals as Prisma.InputJsonValue },
    });
    return totals;
  }

  private toDto(
    estimate: {
      id: string;
      projectId: string;
      version: number;
      tier: string;
      totals: unknown;
      createdAt: Date;
      items: {
        id: string;
        name: string;
        category: string;
        quantity: string;
        unit: string;
        unitPrice: string;
        labourHours: string | null;
        labourRate: string | null;
        discountPercent: string;
        taxPercent: string;
        priceSource: string;
        confirmed: boolean;
      }[];
    },
  ) {
    const unconfirmedAi = estimate.items.filter(
      (i) => i.priceSource === "ai_suggestion" && !i.confirmed,
    ).length;

    return {
      id: estimate.id,
      projectId: estimate.projectId,
      version: estimate.version,
      tier: estimate.tier,
      totals: estimate.totals,
      lineItems: estimate.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        labourHours: item.labourHours,
        labourRate: item.labourRate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        priceSource: item.priceSource,
        confirmed: item.confirmed,
      })),
      warnings:
        unconfirmedAi > 0
          ? [
              `${unconfirmedAi} AI-suggested price(s) need confirmation before customer delivery.`,
            ]
          : [],
      createdAt: estimate.createdAt.toISOString(),
    };
  }
}
