# Use the official Node.js image
FROM node:20-alpine3.20

# Set the working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN npm install

# Expose port 5000 (or whatever your API uses)
EXPOSE 4000

# Enable polling for file changes
ENV CHOKIDAR_USEPOLLING=true

# Start the Express server
CMD ["npm", "start"]
