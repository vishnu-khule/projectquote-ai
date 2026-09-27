import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@Controller()
export class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "projectquote-api",
      version: "0.1.0",
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get("metrics")
  metrics() {
    return {
      service: "projectquote-api",
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };
  }
}
