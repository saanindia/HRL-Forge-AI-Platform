# -------- Stage 1: build the React production bundle --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (leverage layer cache)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build the production bundle (NODE_ENV=production is set by cross-env in `yarn build`)
ENV DISABLE_ESLINT_PLUGIN=true
RUN yarn build

# -------- Stage 2: serve static assets via nginx --------
FROM nginx:1.27-alpine AS runner

# Copy built assets from stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config: SPA fallback + gzip + long-lived cache for static assets
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Railway supplies $PORT at runtime; default to 3000 locally
ENV PORT=3000
EXPOSE 3000

# nginx:alpine automatically substitutes env vars in templates via envsubst
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
