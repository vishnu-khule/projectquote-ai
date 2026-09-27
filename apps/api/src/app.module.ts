import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AiModule } from "./ai/ai.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { RequestLoggingMiddleware } from "./common/request-logging.middleware.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { EstimationModule } from "./estimation/estimation.module.js";
import { ProposalsModule } from "./proposals/proposals.module.js";
import { SharingModule } from "./sharing/sharing.module.js";
import { ValidationModule } from "./validation/validation.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { OrganizationModule } from "./organization/organization.module.js";
import { HealthController } from "./health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      },
    ]),
    PrismaModule,
    StorageModule,
    AuthModule,
    ProjectsModule,
    DocumentsModule,
    AiModule,
    EstimationModule,
    ProposalsModule,
    SharingModule,
    ValidationModule,
    CatalogModule,
    OrganizationModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
