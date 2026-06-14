# Use a lightweight Node.js LTS base image
FROM node:20-slim

# Create and define the application workspace
WORKDIR /usr/src/app

# Copy dependency definition manifest files
COPY package*.json ./

# Install production dependencies only (keeps image small and builds fast)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port for API connections
EXPOSE 5001

# Declare persistent volume mount point for SQLite database file
VOLUME ["/usr/src/app/data"]

# Start the Express server
CMD ["node", "index.js"]
