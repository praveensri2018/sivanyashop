# Stage 1 — Build (optional, if using TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy the rest of the backend code
COPY . .

# If using TypeScript, build
# RUN npm run build  # => PLACE: uncomment if you have TS build script

# Stage 2 — Production image
FROM node:20-alpine

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy backend code (or build output if TS)
COPY --from=builder /app . 

# Expose the port your backend listens on
EXPOSE 3000  # => PLACE: match your backend server port

# Start the server
CMD ["node", "index.js"]  # => PLACE: change if your entry file is different
