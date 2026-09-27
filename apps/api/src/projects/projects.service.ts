import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type Project, type ProjectStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { assertProjectStatusTransition } from "./project-state-machine.js";
import type {
  CreateProjectBody,
  TransitionProjectStatusBody,
  UpdateProjectBody,
} from "./projects.schemas.js";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, body: CreateProjectBody) {
    let customerId: string | undefined;
    if (body.customerName) {
      const customer = await this.prisma.customer.create({
        data: {
          organizationId: orgId,
          name: body.customerName,
        },
      });
      customerId = customer.id;
    }

    const project = await this.prisma.project.create({
      data: {
        organizationId: orgId,
        customerId,
        title: body.title,
        projectType: body.projectType,
        projectDescription: body.projectDescription,
        location: body.location,
        status: "DRAFT",
      },
      include: { customer: true },
    });

    return this.toDto(project);
  }

  async list(orgId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      include: { customer: true },
    });
    return projects.map((p) => this.toDto(p));
  }

  async getById(orgId: string, projectId: string) {
    const project = await this.findProjectOrThrow(orgId, projectId);
    return this.toDto(project);
  }

  async update(orgId: string, projectId: string, body: UpdateProjectBody) {
    await this.findProjectOrThrow(orgId, projectId);
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.projectDescription !== undefined
          ? { projectDescription: body.projectDescription }
          : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.requirements !== undefined
          ? { requirements: body.requirements as Prisma.InputJsonValue }
          : {}),
      },
      include: { customer: true },
    });
    return this.toDto(project);
  }

  async assertProjectAccess(orgId: string, projectId: string) {
    await this.findProjectOrThrow(orgId, projectId);
  }

  async transitionStatusBySystem(
    orgId: string,
    projectId: string,
    status: ProjectStatus,
  ) {
    const project = await this.findProjectOrThrow(orgId, projectId);
    assertProjectStatusTransition(project.status, status);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status },
    });
  }

  async transitionStatus(
    orgId: string,
    projectId: string,
    body: TransitionProjectStatusBody,
  ) {
    const project = await this.findProjectOrThrow(orgId, projectId);
    try {
      assertProjectStatusTransition(project.status, body.status as ProjectStatus);
    } catch {
      throw new ConflictException({
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition from ${project.status} to ${body.status}`,
      });
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: body.status as ProjectStatus },
      include: { customer: true },
    });
    return this.toDto(updated);
  }

  private async findProjectOrThrow(orgId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { customer: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (project.organizationId !== orgId) {
      throw new ForbiddenException("Project not in your organization");
    }
    return project;
  }

  private toDto(
    project: Project & {
      customer?: { id: string; name: string; email: string | null } | null;
    },
  ) {
    return {
      id: project.id,
      organizationId: project.organizationId,
      customerId: project.customerId,
      customer: project.customer
        ? {
            id: project.customer.id,
            name: project.customer.name,
            email: project.customer.email,
          }
        : undefined,
      projectType: project.projectType,
      title: project.title,
      projectDescription: project.projectDescription,
      location: project.location,
      status: project.status,
      requirements: project.requirements,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
