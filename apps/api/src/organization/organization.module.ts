import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrganizationController } from "./organization.controller.js";
import { OrganizationInviteService } from "./organization-invite.service.js";
import { OrganizationPublicController } from "./organization-public.controller.js";
import { OrganizationService } from "./organization.service.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-insecure-change-me",
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TTL ?? "15m",
      },
    }),
  ],
  controllers: [OrganizationController, OrganizationPublicController],
  providers: [OrganizationService, OrganizationInviteService],
  exports: [OrganizationService, OrganizationInviteService],
})
export class OrganizationModule {}
