import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { UpdateOrganizationSettingsBody } from "./organization.schemas.js";

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return {
      id: org.id,
      name: org.name,
      country: org.country,
      currency: org.currency,
      defaultTaxPercent: org.defaultTaxPercent,
    };
  }

  async updateSettings(orgId: string, body: UpdateOrganizationSettingsBody) {
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { defaultTaxPercent: body.defaultTaxPercent },
    });
    return {
      id: org.id,
      name: org.name,
      country: org.country,
      currency: org.currency,
      defaultTaxPercent: org.defaultTaxPercent,
    };
  }
}
