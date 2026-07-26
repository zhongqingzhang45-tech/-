# Life: stage-web 生产镜像
# - 多阶段构建：build-stage 完成 vite build，production-stage 只放产物 + nginx
# - ARG/ENV：支持构建时注入 VITE_ 变量与资源下载开关
# - nginx：envsubst 模板注入 API_UPSTREAM，SPA fallback，gzip，安全头

FROM node:24-trixie AS build-stage

WORKDIR /app

# Life: 构建时可注入的 ARG
# - VITE_ENABLE_POSTHOG: 是否启用 PostHog 埋点
# - LIFE_SKIP_ASSET_DOWNLOAD: 跳过 Live2D/VRM 模型资产下载（镜像体积优先时用）
# - LIFE_DISABLE_SOURCEMAP: 关闭 sourcemap 减少 build 内存峰值
# - LIFE_DISABLE_MINIFY: 关闭 minify 减少 build 内存峰值（产物体积由 nginx gzip 弥补）
ARG VITE_ENABLE_POSTHOG=false
ARG LIFE_SKIP_ASSET_DOWNLOAD=1
ARG LIFE_DISABLE_SOURCEMAP=1
ARG LIFE_DISABLE_MINIFY=1

ENV VITE_ENABLE_POSTHOG=${VITE_ENABLE_POSTHOG}
ENV LIFE_SKIP_ASSET_DOWNLOAD=${LIFE_SKIP_ASSET_DOWNLOAD}
ENV LIFE_DISABLE_SOURCEMAP=${LIFE_DISABLE_SOURCEMAP}
ENV LIFE_DISABLE_MINIFY=${LIFE_DISABLE_MINIFY}
# Life: 6GB 内存上限，避免 rolldown rendering chunks 阶段 OOM
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN apt update && apt install -y ca-certificates curl build-essential python3 python3-setuptools
RUN update-ca-certificates

RUN corepack enable

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Life: 先构建 packages（dist），再构建 stage-web
RUN pnpm run build:packages || true

RUN pnpm -F @proj-airi/stage-web run build && \
    pnpm -F @proj-airi/docs run build:base && \
    mv ./docs/.vitepress/dist ./apps/stage-web/dist/docs && \
    pnpm -F @proj-airi/stage-ui run story:build && \
    mv ./packages/stage-ui/.histoire/dist ./apps/stage-web/dist/ui

# --- production stage ---
FROM nginx:stable-alpine AS production-stage

# Life: envsubst 用于启动时替换 nginx.conf 里的 ${API_UPSTREAM}
RUN apk add --no-cache gettext

# 默认后端地址：同 compose 网络下 backend:3000
ENV API_UPSTREAM=backend:3000

COPY --from=build-stage /app/apps/stage-web/dist /usr/share/nginx/html
COPY apps/stage-web/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
