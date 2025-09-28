# E-Commerce Platform

This project contains:
- **Frontend:** Angular (customer-first SPA, lazy-loaded admin/retailer modules)
- **Backend:** Next.js (API-only, lightweight)
- **Database:** MSSQL
- **Deployment:** Docker (Linux server)

---

## Prerequisites

### Windows (Local Development)
- Node.js (>=18.x) installed from [nodejs.org](https://nodejs.org/)
- Angular CLI: `npm install -g @angular/cli`
- Docker Desktop for Windows
- Git Bash or PowerShell

### Linux (Server Deployment)
- Node.js (>=18.x)
- Docker & Docker Compose installed
- MSSQL server running (local Docker container or remote)
- Nginx or Caddy (for reverse proxy, optional)

---

## Frontend (Angular)

Folder: `frontend/sivanyashop`

### Local Development (Windows)
```bash
cd frontend/sivanyashop
npm install
ng serve --open
```

### Build for Production (Linux server)
```bash
cd frontend/sivanyashop
npm install --production
ng build --configuration production
```

### Docker (Linux server)
`Dockerfile.angular` (example):
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install -g @angular/cli && npm install
COPY . .
RUN ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/sivanyashop /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build & run:
```bash
docker build -t angular-frontend -f Dockerfile.angular ./frontend/sivanyashop
docker run -d -p 8080:80 angular-frontend
```

---

## Backend (Next.js API-only)

Folder: `backend`

### Local Development (Windows)
```bash
cd backend
npm install
npm run dev
```

### Build & Run on Linux server
```bash
cd backend
npm install --production
npm run build
npm start
```

### Docker (Linux server)
`Dockerfile.nextjs` (example):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t nextjs-api -f Dockerfile.nextjs ./backend
docker run -d -p 3000:3000 nextjs-api
```

---

## Database (MSSQL)

For local dev (Windows), run SQL Server in Docker:
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd"    -p 1433:1433 --name mssql -d mcr.microsoft.com/mssql/server:2022-latest
```

For Linux server, use the same command (adjust password/volume mount for persistence).

Run migrations from backend service:
```bash
npm run migrate
```

---

## Notes
- **Windows dev:** run Angular via `ng serve`, Next.js via `npm run dev`, MSSQL in Docker.  
- **Linux server:** build Angular static files, serve via Nginx container; run Next.js API in Docker.  
- Reverse proxy (Nginx/Caddy) can serve Angular on `/` and Next.js API on `/api`.  
- Environment variables (`.env`) required for DB connection, JWT secret, and payment gateway keys.

---

## Environment Variables

Backend (`.env`):
```env
DATABASE_URL="mssql://sa:YourStrong!Passw0rd@localhost:1433/SivanyaShop"
JWT_SECRET="supersecretkey"
PAYMENT_GATEWAY_KEY="your_gateway_key"
```

Frontend (`src/environments/environment.ts`):
```ts
export const environment = {
  production: false,
  apiBaseUrl: "http://localhost:3000/api"
};
```

For production (`environment.prod.ts`):
```ts
export const environment = {
  production: true,
  apiBaseUrl: "https://yourdomain.com/api"
};
```

---

## Quick Start

### Windows (Local)
1. Run MSSQL in Docker.  
2. Start backend API: `cd backend && npm run dev`.  
3. Start frontend: `cd frontend/sivanyashop && ng serve`.  
4. Visit `http://localhost:4200`.

### Linux (Server)
1. Build Angular frontend image & run container.  
2. Build Next.js API image & run container.  
3. Run MSSQL container or connect to managed DB.  
4. Use Nginx reverse proxy:  
   - `/` → Angular container (`:8080`)  
   - `/api` → Next.js container (`:3000`)  

---
