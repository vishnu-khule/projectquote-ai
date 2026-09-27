import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { ChatService } from "./chat.service.js";
import { ChatMessageBodySchema, type ChatMessageBody } from "./chat.schemas.js";

@Controller("projects/:projectId/chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get("messages")
  listMessages(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
  ) {
    return this.chat.listMessages(user.orgId, projectId);
  }

  @Post()
  send(
    @CurrentUser() user: JwtPayload,
    @Param("projectId") projectId: string,
    @Body(new ZodValidationPipe(ChatMessageBodySchema)) body: ChatMessageBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (body.stream) {
      return this.chat.sendMessage(
        user.orgId,
        projectId,
        body.message,
        true,
        res,
      );
    }
    return this.chat.sendMessage(
      user.orgId,
      projectId,
      body.message,
      false,
    );
  }
}
