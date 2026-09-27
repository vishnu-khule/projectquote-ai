FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api ./apps/api
COPY packages/schemas ./packages/schemas
COPY config ./config
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @projectquote/schemas build
RUN pnpm --filter @projectquote/api exec prisma generate
RUN pnpm --filter @projectquote/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/config ./config
EXPOSE 4000
CMD ["node", "dist/main.js"]
