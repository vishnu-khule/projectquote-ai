import "./bootstrap/load-env.js";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { assertProductionSecrets } from "./bootstrap/production-guards.js";
import { initSentry } from "./bootstrap/sentry.js";

async function bootstrap() {
  assertProductionSecrets();
  await initSentry();
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production",
    }),
  );
  const corsOrigin = process.env.APP_URL ?? "http://localhost:3000";
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
