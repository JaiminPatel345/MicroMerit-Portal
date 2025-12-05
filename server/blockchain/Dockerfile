# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for dev mode)
RUN npm install

# Copy source code and contracts
COPY src ./src
COPY contracts ./contracts
COPY scripts ./scripts
COPY hardhat.config.js ./

# Expose port 3001
EXPOSE 3001

# Start the service in development mode with hot-reload
CMD ["npm", "run", "dev"]
