# -------- Stage 1: build the React production bundle --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (leverage layer cache)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Ensure production build with NODE_ENV=production
ENV NODE_ENV=production
ENV DISABLE_ESLINT_PLUGIN=true
RUN yarn build

# -------- Stage 2: serve the static build with `serve` --------
FROM node:20-alpine AS runner

WORKDIR /srv

# Install a tiny static server
RUN yarn global add serve@14

# Copy built assets only — NO source, NO dev deps
COPY --from=builder /app/build ./build

# Railway supplies $PORT at runtime; default to 3000 locally
ENV PORT=3000
EXPOSE 3000

# `serve -s` = single-page-app mode (fallback to index.html for client-side routes)
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
