# Builds both workspaces (server + client) and runs the server in production,
# serving the client's static build itself - a single container for the whole app.
#
# The npm registry here is a private Artifactory gateway (see .npmrc, gitignored
# but present on disk - `npm ci` needs it to reach the registry from this network).
# .npmrc is only copied into the "deps"/"prod-deps" build stages below, never into
# the final "runtime" stage, so its auth token never ends up in the shipped image
# (multi-stage builds only export the final stage's layers).
#
# Build:  docker build -t battery-calculator .
# Run:    docker run --rm -p 3001:3001 battery-calculator

FROM node:22-alpine AS deps
WORKDIR /app
COPY .npmrc package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

FROM deps AS build
COPY server server
COPY client client
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY .npmrc package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace=server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=prod-deps /app/package.json package.json
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist server/public

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
