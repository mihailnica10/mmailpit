FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src/ ./src/
RUN bun build src/index.ts --outdir ./dist --target node

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/dist
EXPOSE 3000
USER bun
CMD ["bun", "run", "/app/dist/index.js"]