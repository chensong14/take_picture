FROM node:22-bookworm-slim

WORKDIR /app/services/worker
COPY services/worker/package*.json ./
RUN npm ci --omit=dev
COPY services/worker/src ./src

ENV NODE_ENV=production
CMD ["node", "src/worker.js"]
