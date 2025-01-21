# Use Debian Bookworm as the base image
FROM ubuntu:latest as builder

# Update package list and install dependencies
RUN apt-get update && \
    apt-get install -y \
    git \
    vim \
    curl \
    gnupg2 \
    lsb-release \
    ca-certificates

# Install Node.js (latest LTS version) and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install additional developer tools (optional)
RUN apt-get install -y \
    neovim \
    gh # GitHub CLI

# Default command (to keep the container running)
CMD ["tail", "-f", "/dev/null"]
