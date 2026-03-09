# Stage 1: Build the React/Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Build argument — pass Azure API URL at build time
ARG VITE_API_GATEWAY_URL=http://localhost:8001
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build (VITE_API_GATEWAY_URL is baked into the JS bundle)
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
