import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import {
  LoginBodySchema,
  RegisterBodySchema,
  type LoginBody,
  type RegisterBody,
} from "./auth.schemas.js";
import type { JwtPayload } from "./auth.types.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(
    @Body(new ZodValidationPipe(RegisterBodySchema)) body: RegisterBody,
  ) {
    return this.auth.register(body);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(LoginBodySchema)) body: LoginBody) {
    return this.auth.login(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user);
  }

  /** Phase 1.5 placeholder — set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to enable wiring. */
  @Get("oauth/google")
  googleOAuthStatus() {
    return {
      enabled: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      message:
        "Google sign-in UI is Phase 1.5. Use email/password for MVP; OAuth routes will attach here.",
    };
  }
}
