import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { seedDevUser } from "../bootstrap/seed-dev-user.js";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await seedDevUser(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
