# ===== 阶段 1: 依赖安装 =====
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ===== 阶段 2: 构建 =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# 构建前设置环境变量（按需修改）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===== 阶段 3: 运行 =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
