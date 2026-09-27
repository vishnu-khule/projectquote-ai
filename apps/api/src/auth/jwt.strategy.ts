import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "./auth.types.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-insecure-change-me",
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: payload.orgId,
          userId: payload.sub,
        },
      },
    });
    if (!membership) {
      throw new UnauthorizedException("Organization access revoked");
    }
    return payload;
  }
}
