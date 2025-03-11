# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Stage 2: Non-Production (Use this if you need a test environment)
FROM node:18 AS non_production
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["npm", "start"]

