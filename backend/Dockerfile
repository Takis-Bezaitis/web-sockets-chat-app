# Use lightweight Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Prevent some Prisma engine issues
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Optional: increase npm retry timeout (helps with slow networks / HDD issues)
RUN npm config set fetch-retry-maxtimeout 600000

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (offline + no audit/fund to reduce network calls)
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma client explicitly
RUN npx prisma generate

# Expose backend port
EXPOSE 5000

# Start the app
CMD ["npm", "run", "start"]