# Multi-stage Dockerfile

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install
COPY server/ ./

# Stage 3: Final runtime image
FROM node:18-alpine
WORKDIR /app

# Copy over frontend build artifacts
COPY --from=frontend-builder /app/web/dist ./web/dist

RUN npm install -g serve
RUN apk update && apk add yt-dlp

# Copy over backend code
COPY --from=backend-builder /app/server ./server

WORKDIR /app/server
# Start both frontend and backend services
CMD ["sh", "-c", "node /app/server/server.js & serve -s /app/web/dist -l 8080"]

