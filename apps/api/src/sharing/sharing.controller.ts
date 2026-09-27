import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { SharingService } from "./sharing.service.js";

@Controller()
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Post("proposals/:proposalId/share")
  @UseGuards(JwtAuthGuard)
  createShare(
    @CurrentUser() user: JwtPayload,
    @Param("proposalId") proposalId: string,
  ) {
    return this.sharing.createShare(user.orgId, proposalId, 30);
  }

  @Get("shared/proposals/:token")
  getPublic(@Param("token") token: string) {
    return this.sharing.getPublicProposal(token);
  }

  @Get("shared/proposals/:token/pdf")
  @Header("Content-Type", "application/pdf")
  async downloadPublic(@Param("token") token: string) {
    const { buffer, fileName } = await this.sharing.downloadPublicPdf(token);
    return new StreamableFile(buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}
