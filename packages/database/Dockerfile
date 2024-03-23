# https://github.com/vercel/turbo/issues/5462
# https://pnpm.io/cli/fetch
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN yarn global add pnpm
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update

# Prune the workspace for the app
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune --scope=database --docker


# Copy source code of pruned subworkspace and build
FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-*.yaml .
COPY .gitignore .gitignore
COPY turbo.json turbo.json

RUN pnpm install
RUN pnpm turbo run build --filter=database


FROM node:20-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 drizzle
USER drizzle

COPY --from=builder /app .
CMD yarn --cwd packages/database db:generate && yarn --cwd packages/database db:migrate