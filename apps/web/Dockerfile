# Web Dockerfile for Development
FROM node:slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose ports for Angular dev server and HMR
EXPOSE 4200 49153

# Start Angular development server with host 0.0.0.0 to make it accessible outside container
# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
