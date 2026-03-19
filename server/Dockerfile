FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Required by pdf2pic for PDF to image conversion.
RUN apt-get update \
    && apt-get install -y --no-install-recommends graphicsmagick ghostscript \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/data ./data
COPY --from=build /app/eng.traineddata ./eng.traineddata

RUN mkdir -p temp \
    && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/src/server.js"]
