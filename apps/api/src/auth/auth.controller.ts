import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import {
  GoogleSignInSchema,
  LoginBodySchema,
  RegisterBodySchema,
  type GoogleSignInBody,
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

  @Post("google")
  googleSignIn(
    @Body(new ZodValidationPipe(GoogleSignInSchema)) body: GoogleSignInBody,
  ) {
    return this.auth.googleSignIn(body.idToken);
  }

  @Get("oauth/google")
  googleOAuthStatus() {
    return {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      clientId: process.env.GOOGLE_CLIENT_ID ?? null,
    };
  }

}
