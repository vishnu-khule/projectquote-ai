import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateCatalogItemBody } from "./catalog.schemas.js";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.priceCatalogItem.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    });
  }

  create(orgId: string, body: CreateCatalogItemBody) {
    return this.prisma.priceCatalogItem.create({
      data: {
        organizationId: orgId,
        sku: body.sku,
        name: body.name,
        category: body.category,
        unit: body.unit,
        unitPrice: body.unitPrice,
        taxPercent: body.taxPercent ?? "18",
      },
    });
  }
}
