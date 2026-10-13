FROM node:22-bookworm-slim

WORKDIR /app/services/api
COPY services/api/package*.json ./
RUN npm ci --omit=dev
COPY services/api/src ./src
COPY services/api/scripts ./scripts
COPY database /app/database

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
