import "reflect-metadata";
import "./bootstrap/load-env.js";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { assertProductionSecrets } from "./bootstrap/production-guards.js";
import { devCorsOrigins } from "./bootstrap/cors.js";
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
  app.enableCors({
    origin: devCorsOrigins(),
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
