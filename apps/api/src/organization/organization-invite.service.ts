import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "../auth/auth.types.js";

const INVITE_TTL_DAYS = 7;

@Injectable()
export class OrganizationInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async list(orgId: string, userId: string) {
    await this.assertOwner(orgId, userId);
    return this.prisma.organizationInvite.findMany({
      where: { organizationId: orgId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async create(orgId: string, userId: string, email: string, role: "MEMBER" | "ADMIN") {
    await this.assertOwner(orgId, userId);
    const normalized = email.toLowerCase().trim();

    const existingMember = await this.prisma.user.findFirst({
      where: {
        email: normalized,
        memberships: { some: { organizationId: orgId } },
      },
    });
    if (existingMember) {
      throw new ConflictException("User is already in this organization");
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invite = await this.prisma.organizationInvite.upsert({
      where: {
        organizationId_email: { organizationId: orgId, email: normalized },
      },
      create: {
        organizationId: orgId,
        email: normalized,
        role,
        tokenHash,
        expiresAt,
      },
      update: {
        role,
        tokenHash,
        expiresAt,
        acceptedAt: null,
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return {
      inviteId: invite.id,
      email: normalized,
      expiresAt: invite.expiresAt.toISOString(),
      acceptUrl: `${appUrl}/accept-invite?token=${token}`,
    };
  }

  async accept(input: {
    token: string;
    password: string;
    name?: string;
  }) {
    const tokenHash = this.hashToken(input.token);
    const invite = await this.prisma.organizationInvite.findFirst({
      where: { tokenHash },
      include: { organization: true },
    });
    if (!invite || invite.acceptedAt) {
      throw new NotFoundException("Invalid or used invite");
    }
    if (invite.expiresAt < new Date()) {
      throw new NotFoundException("Invite expired");
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existing) {
      const valid = await bcrypt.compare(input.password, existing.passwordHash);
      if (!valid) {
        throw new ConflictException("Invalid password for existing account");
      }
      await this.prisma.$transaction(async (tx) => {
        await tx.organizationMember.create({
          data: {
            userId: existing.id,
            organizationId: invite.organizationId,
            role: invite.role,
          },
        });
        await tx.organizationInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        });
      });
      return this.buildSession(existing.id, invite.organizationId);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          name: input.name,
        },
      });
      await tx.organizationMember.create({
        data: {
          userId: created.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
      });
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    return this.buildSession(user.id, invite.organizationId);
  }

  private async buildSession(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!user || !organization) {
      throw new NotFoundException("User or organization not found");
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: organization.id,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
      organization: {
        id: organization.id,
        name: organization.name,
        country: organization.country,
        currency: organization.currency,
        defaultTaxPercent: organization.defaultTaxPercent,
      },
    };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async assertOwner(orgId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (!member || member.role !== "OWNER") {
      throw new ForbiddenException("Only organization owners can manage invites");
    }
  }
}
