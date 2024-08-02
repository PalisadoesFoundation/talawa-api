# Stage 1: Install Dependencies
FROM ubuntu:latest as builder

# Set a non-interactive shell
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/src/app

# Install Node.js and npm
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Stage 2: Final image
FROM ubuntu:latest

WORKDIR /usr/src/app

# Install Git, Node.js, and cleanup in one layer to keep the image slim
RUN apt-get update && \
    apt-get install -y git curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy built application from builder stage
COPY --from=builder /usr/src/app ./

# Expose the port the app runs on
EXPOSE 4000

# Set the frontend back to dialog
ENV DEBIAN_FRONTEND=dialog

# Command to run the application
CMD ["npm", "run", "dev"]
