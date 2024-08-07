# Stage 1: Install Dependencies
FROM ubuntu:latest as builder

RUN apt-get update && \
    apt-get install -y git curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs 


CMD ["tail", "-f", "/dev/null"]



