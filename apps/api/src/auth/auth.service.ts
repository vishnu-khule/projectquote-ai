import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";
import type { JwtPayload } from "./auth.types.js";
import type { LoginBody, RegisterBody } from "./auth.schemas.js";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(body: RegisterBody) {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const orgName =
      body.organizationName?.trim() ||
      (body.name ? `${body.name}'s workspace` : "My workspace");

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email.toLowerCase(),
          passwordHash,
          name: body.name,
        },
      });
      const organization = await tx.organization.create({
        data: { name: orgName },
      });
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });
      return { user, organization };
    });

    const token = this.signToken({
      sub: result.user.id,
      email: result.user.email,
      orgId: result.organization.id,
    });

    return {
      accessToken: token,
      user: this.toUserDto(result.user),
      organization: this.toOrgDto(result.organization),
    };
  }

  async login(body: LoginBody) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        memberships: {
          include: { organization: true },
          orderBy: { organization: { createdAt: "asc" } },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException("User has no organization");
    }

    const token = this.signToken({
      sub: user.id,
      email: user.email,
      orgId: membership.organizationId,
    });

    return {
      accessToken: token,
      user: this.toUserDto(user),
      organization: this.toOrgDto(membership.organization),
    };
  }

  async me(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    const organization = await this.prisma.organization.findUnique({
      where: { id: payload.orgId },
    });
    if (!user || !organization) {
      throw new UnauthorizedException();
    }
    return {
      user: this.toUserDto(user),
      organization: this.toOrgDto(organization),
    };
  }

  private signToken(payload: JwtPayload) {
    return this.jwt.sign(payload);
  }

  private toUserDto(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private toOrgDto(org: {
    id: string;
    name: string;
    country: string;
    currency: string;
    defaultTaxPercent?: string;
  }) {
    return {
      id: org.id,
      name: org.name,
      country: org.country,
      currency: org.currency,
      defaultTaxPercent: org.defaultTaxPercent ?? "18",
    };
  }
}
