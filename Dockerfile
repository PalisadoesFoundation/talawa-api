# Stage 1: Install Dependencies
FROM node:lts as builder

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

# Stage 2: Final image
FROM node:lts-bookworm-slim

WORKDIR /usr/src/app

# Install Git
RUN apt-get update && \
    apt-get install -y git && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app ./

EXPOSE 4000

CMD ["npm", "run", "dev"]
