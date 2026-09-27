import { Controller, MessageEvent, Param, Sse, UseGuards } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { DocumentEventsService } from "../documents/document-events.service.js";
import { ProjectsService } from "./projects.service.js";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsEventsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly documentEvents: DocumentEventsService,
  ) {}

  @Sse(":id/events")
  async streamEvents(
    @CurrentUser() user: JwtPayload,
    @Param("id") projectId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.projects.assertProjectAccess(user.orgId, projectId);

    return new Observable((subscriber) => {
      const unsubscribe = this.documentEvents.subscribe(
        projectId,
        (event) => {
          subscriber.next({
            data: event,
          });
        },
      );

      subscriber.next({
        data: { type: "connected", projectId },
      });

      return () => unsubscribe();
    });
  }
}
