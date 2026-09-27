import * as bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { devSeedEmail } from "../auth/normalize-login-email.js";

const BCRYPT_ROUNDS = 12;

export async function seedDevUser(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  if (process.env.DEV_SEED_USER === "false") {
    return;
  }

  const email = devSeedEmail();
  const password = process.env.DEV_SEED_PASSWORD ?? "vishnu";
  const name = process.env.DEV_SEED_NAME ?? "vishnu";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, name },
    });
    const organization = await tx.organization.create({
      data: { name: `${name}'s workspace` },
    });
    await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
  });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code === "P2002") {
      return;
    }
    throw err;
  }

  console.log(`[dev] Seeded default user: ${email} (password from DEV_SEED_PASSWORD)`);
}
