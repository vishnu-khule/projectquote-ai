import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { ProposalSection } from "@projectquote/schemas";
import { PrismaService } from "../prisma/prisma.service.js";
import { ProjectsService } from "../projects/projects.service.js";
import { StorageService } from "../storage/storage.service.js";
import { PdfService } from "../pdf/pdf.service.js";
import { ProposalBuilderService } from "./proposal-builder.service.js";
import { ValidationService } from "../validation/validation.service.js";

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly builder: ProposalBuilderService,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
    private readonly validation: ValidationService,
  ) {}

  async getLatest(orgId: string, projectId: string) {
    await this.projects.assertProjectAccess(orgId, projectId);
    const proposal = await this.prisma.proposal.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });
    return proposal ? this.toDto(proposal) : null;
  }

  async generate(orgId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
        customer: true,
        estimates: {
          orderBy: { version: "desc" },
          take: 1,
          include: { items: true },
        },
      },
    });
    if (!project || project.organizationId !== orgId) {
      throw new NotFoundException("Project not found");
    }

    const estimate = project.estimates[0];
    if (!estimate) {
      throw new BadRequestException("Create an estimate before generating a proposal");
    }

    const unconfirmed = estimate.items.filter(
      (i) => i.priceSource === "ai_suggestion" && !i.confirmed,
    );
    if (unconfirmed.length > 0) {
      throw new BadRequestException({
        code: "UNCONFIRMED_PRICES",
        message: `${unconfirmed.length} line item(s) need price confirmation`,
      });
    }

    const requirements = (project.requirements ?? {}) as Record<string, unknown>;
    const assumptions = Array.isArray(requirements.assumptions)
      ? (requirements.assumptions as string[])
      : [];
    const exclusions = Array.isArray(requirements.exclusions)
      ? (requirements.exclusions as string[])
      : [];

    const built = this.builder.build({
      projectTitle: project.title,
      projectDescription: project.projectDescription,
      location: project.location,
      customerName: project.customer?.name,
      organizationName: project.organization.name,
      lineItems: estimate.items,
      totals: estimate.totals as Record<string, string>,
      assumptions,
      exclusions,
    });

    const lastVersion = await this.prisma.proposal.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    });
    const version = (lastVersion?.version ?? 0) + 1;

    const proposal = await this.prisma.proposal.create({
      data: {
        projectId,
        estimateId: estimate.id,
        title: built.title,
        version,
        tier: estimate.tier,
        sections: built.sections as Prisma.InputJsonValue,
        status: "review",
      },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        projectId,
        "PROPOSALS_GENERATED",
      );
      await this.projects.transitionStatusBySystem(
        orgId,
        projectId,
        "USER_REVIEW",
      );
    } catch {
      /* ignore */
    }

    return this.toDto(proposal);
  }

  async updateSection(
    orgId: string,
    proposalId: string,
    sectionId: string,
    content: string,
  ) {
    const proposal = await this.findForOrg(orgId, proposalId);
    if (proposal.status === "approved" || proposal.status === "pdf_ready") {
      throw new BadRequestException("Cannot edit approved proposal");
    }

    const sections = proposal.sections as ProposalSection[];
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, content } : s,
    );
    if (!sections.some((s) => s.id === sectionId)) {
      throw new NotFoundException("Section not found");
    }

    const row = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { sections: updated as Prisma.InputJsonValue },
    });
    return this.toDto(row);
  }

  async approve(orgId: string, proposalId: string, userId: string) {
    const proposal = await this.findForOrg(orgId, proposalId);
    if (!proposal.estimateId) {
      throw new BadRequestException("Proposal missing estimate link");
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

    const estimate = await this.prisma.estimate.findUnique({
      where: { id: proposal.estimateId },
      include: { items: true },
    });
    const unconfirmed =
      estimate?.items.filter(
        (i) => i.priceSource === "ai_suggestion" && !i.confirmed,
      ) ?? [];
    if (unconfirmed.length > 0) {
      throw new BadRequestException("Confirm all AI-suggested prices before approval");
    }

    const row = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedByUserId: userId,
      },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        proposal.projectId,
        "APPROVED",
      );
    } catch {
      /* ignore */
    }

    return this.toDto(row);
  }

  async generatePdf(orgId: string, proposalId: string) {
    const proposal = await this.findForOrg(orgId, proposalId);
    if (proposal.status !== "approved" && proposal.status !== "pdf_ready") {
      throw new BadRequestException("Proposal must be approved before PDF generation");
    }

    const project = proposal.project;
    const sections = proposal.sections as ProposalSection[];
    const buffer = await this.pdf.renderProposalPdf({
      title: proposal.title ?? `Proposal v${proposal.version}`,
      organizationName: project.organization.name,
      sections,
    });

    const key = this.storage.buildDocumentKey(
      project.organizationId,
      project.id,
      `proposal-v${proposal.version}.pdf`,
    );
    await this.storage.putObject(key, buffer, "application/pdf");

    const row = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "pdf_ready", pdfS3Key: key },
    });

    try {
      await this.projects.transitionStatusBySystem(
        orgId,
        project.id,
        "PDF_GENERATED",
      );
    } catch {
      /* ignore */
    }

    return {
      proposal: this.toDto(row),
      downloadPath: `/proposals/${proposalId}/pdf`,
    };
  }

  async downloadPdf(orgId: string, proposalId: string) {
    const proposal = await this.findForOrg(orgId, proposalId);
    if (!proposal.pdfS3Key) {
      throw new NotFoundException("PDF not generated yet");
    }
    const buffer = await this.storage.getObjectBuffer(proposal.pdfS3Key);
    return { buffer, fileName: `proposal-${proposal.version}.pdf` };
  }

  private async findForOrg(orgId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { project: { include: { organization: true } } },
    });
    if (!proposal || proposal.project.organizationId !== orgId) {
      throw new NotFoundException("Proposal not found");
    }
    return proposal;
  }

  private toDto(proposal: {
    id: string;
    projectId: string;
    estimateId: string | null;
    title: string | null;
    version: number;
    tier: string;
    sections: unknown;
    status: string;
    approvedAt: Date | null;
    approvedByUserId: string | null;
    pdfS3Key: string | null;
    createdAt: Date;
  }) {
    return {
      id: proposal.id,
      projectId: proposal.projectId,
      estimateId: proposal.estimateId,
      title: proposal.title,
      version: proposal.version,
      tier: proposal.tier,
      sections: proposal.sections as ProposalSection[],
      status: proposal.status,
      approvedAt: proposal.approvedAt?.toISOString(),
      approvedByUserId: proposal.approvedByUserId,
      hasPdf: Boolean(proposal.pdfS3Key),
      createdAt: proposal.createdAt.toISOString(),
    };
  }
}
