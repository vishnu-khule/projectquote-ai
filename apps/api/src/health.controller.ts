import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "projectquote-api",
      version: "0.1.0",
    };
  }
}
