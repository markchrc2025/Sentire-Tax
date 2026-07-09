# Sentire BIR API — Sliplane service.
# Build context = repo root; set the Dockerfile path to server/Dockerfile in
# the Sliplane service settings.

FROM node:22-alpine AS build
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server/package.json ./
EXPOSE 8080
CMD ["node", "dist/index.js"]
