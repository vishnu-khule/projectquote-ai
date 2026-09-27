import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { ProposalSection } from "@projectquote/schemas";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { StorageService } from "../storage/storage.service.js";
import { ValidationService } from "../validation/validation.service.js";

type ShareEvent = {
  type: "viewed" | "downloaded";
  at: string;
};

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly storage: StorageService,
    private readonly validation: ValidationService,
  ) {}

  async createShare(
    orgId: string,
    proposalId: string,
    expiresInDays?: number,
  ) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: true },
    });
    if (!proposal || proposal.project.organizationId !== orgId) {
      throw new NotFoundException("Proposal not found");
    }
    if (proposal.status !== "pdf_ready" && !proposal.pdfS3Key) {
      throw new BadRequestException(
        "Generate PDF before sharing with customer",
      );
    }

    const validation = await this.validation.validateProject(
      orgId,
      proposal.projectId,
    );
    if (validation.status === "BLOCKED") {
      throw new ConflictException({
        code: "VALIDATION_BLOCKED",
        validation,
      });
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const expiresAt =
      expiresInDays && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    await this.prisma.share.updateMany({
      where: { proposalId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const share = await this.prisma.share.create({
      data: {
        proposalId,
        tokenHash,
        expiresAt,
      },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        proposal.projectId,
        "SHARED",
      );
    } catch {
      /* ignore */
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return {
      shareId: share.id,
      url: `${appUrl}/share/${token}`,
      expiresAt: share.expiresAt?.toISOString() ?? null,
    };
  }

  async getPublicProposal(token: string) {
    const share = await this.resolveShare(token);
    await this.recordEvent(share.id, "viewed");

    const proposal = share.proposal;
    const sections = (proposal.sections as ProposalSection[]).map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      order: s.order,
    }));

    return {
      title: proposal.title,
      version: proposal.version,
      organizationName: proposal.project.organization.name,
      projectTitle: proposal.project.title,
      customerName: proposal.project.customerId
        ? await this.getCustomerName(proposal.project.customerId)
        : undefined,
      sections,
      hasPdf: Boolean(proposal.pdfS3Key),
    };
  }

  async downloadPublicPdf(token: string) {
    const share = await this.resolveShare(token);
    await this.recordEvent(share.id, "downloaded");

    if (!share.proposal.pdfS3Key) {
      throw new NotFoundException("PDF not available");
    }
    const buffer = await this.storage.getObjectBuffer(share.proposal.pdfS3Key);
    return {
      buffer,
      fileName: `proposal-${share.proposal.version}.pdf`,
    };
  }

  private async resolveShare(token: string) {
    const tokenHash = this.hashToken(token);
    const share = await this.prisma.share.findUnique({
      where: { tokenHash },
      include: {
        proposal: {
          include: {
            project: { include: { organization: true } },
          },
        },
      },
    });
    if (!share || share.revokedAt) {
      throw new NotFoundException("Share link not found");
    }
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException("Share link expired");
    }
    return share;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async recordEvent(shareId: string, type: ShareEvent["type"]) {
    const share = await this.prisma.share.findUnique({ where: { id: shareId } });
    if (!share) return;
    const events = (share.events as ShareEvent[]) ?? [];
    events.push({ type, at: new Date().toISOString() });
    await this.prisma.share.update({
      where: { id: shareId },
      data: { events },
    });
  }

  private async getCustomerName(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    return customer?.name;
  }
}
