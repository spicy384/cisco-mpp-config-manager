# PBX MPP Config Manager
# Small Express app; no build step, so a single stage keeps it simple.
FROM node:22-alpine

# Tini gives us correct signal handling so `docker stop` exits promptly
# instead of waiting out the 10s kill timeout.
RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

WORKDIR /app

# Copy manifests first so `npm ci` is cached until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY public ./public

# The image ships no data; /data is a volume that outlives the container.
# node:alpine already provides an unprivileged `node` user (uid 1000).
RUN mkdir -p /data && chown -R node:node /data /app

USER node
EXPOSE 3000
VOLUME ["/data"]

# Uses the app's own status endpoint, so this fails if Express stops responding.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/api/status',timeout:4000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
