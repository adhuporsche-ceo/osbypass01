FROM node:22-bookworm-slim

ENV PORT=10000
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential dpkg-dev python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --no-package-lock --no-audit --no-fund

COPY . .
RUN bash scripts/package.sh \
    && npm run build

ENV NODE_ENV=production
EXPOSE 10000

CMD ["npm", "start"]