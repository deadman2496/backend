# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000 (or whatever your API uses)
EXPOSE 5000

# Start the Express server
CMD ["npm", "start"]
