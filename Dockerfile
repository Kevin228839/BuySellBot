# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup -S buysellbot -g 1001
RUN adduser -S buysellbot -u 1001 -G buysellbot

# Change ownership of the app directory to the buysellbot user
RUN chown -R buysellbot:buysellbot /app
USER buysellbot

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
