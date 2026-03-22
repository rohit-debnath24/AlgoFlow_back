FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages ./packages
COPY services/node ./services/node
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --filter node-executor --prod
WORKDIR /app/services/node
RUN pnpm build
EXPOSE 3001
CMD ["pnpm", "start"]
