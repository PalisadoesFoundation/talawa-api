# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app's source code to the container
COPY . .

# Expose port 3000 for the app to listen on
EXPOSE 4000

# Start the app when the container launches
CMD ["npm", "run" "dev"]
