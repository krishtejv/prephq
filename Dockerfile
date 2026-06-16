# Stage 1: Build stage
FROM node:20-slim AS build

# Create and define the build workspace
WORKDIR /usr/src/app

# Copy dependency definition manifest files
COPY package*.json ./

# Install development & production dependencies
RUN npm ci

# Copy application source code
COPY . .

# Compile optimized production static assets
RUN npm run build

# Stage 2: Serve stage
FROM nginx:alpine

# Copy compiled static assets from build stage to Nginx html directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for reverse-proxying API calls
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port for web browser access
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
