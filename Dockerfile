# Sentire BIR Form Generator — container image for Docker hosts (Sliplane).
#
# Multi-stage: build the Vite bundle with Node, serve the static output with
# nginx (SPA fallback included — replaces vercel.json's rewrite).
#
# Supabase config can be supplied EITHER way:
#   * Runtime (preferred on Sliplane): set VITE_SUPABASE_URL and
#     VITE_SUPABASE_ANON_KEY as service environment variables — the entrypoint
#     renders them into /env.js on every container start (no rebuild needed).
#   * Build time: pass the same names as --build-arg (baked into the bundle).

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Optional build-time config (runtime env.js takes precedence when set).
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- serve ----------
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker-entrypoint.sh /docker-entrypoint.d/40-render-env.sh
RUN chmod +x /docker-entrypoint.d/40-render-env.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# nginx:alpine's stock entrypoint runs /docker-entrypoint.d/*.sh then nginx.
