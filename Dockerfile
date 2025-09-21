# Stage 1 — Build Angular app
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/sivanyashop/package*.json ./
RUN npm ci

COPY frontend/sivanyashop/ .
RUN npm run build -- --configuration production

# Stage 2 — Serve with Nginx
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/sivanyashop /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
