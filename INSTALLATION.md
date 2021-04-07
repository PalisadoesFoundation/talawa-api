# Installation

Talawa API can be setup to run via `Docker` or default node package manager `Npm`.

## Docker

1. Install these dependencies if you don't already have them
   - [Docker](https://docs.docker.com/engine/install/)
   - [Nodejs](https://nodejs.org/en/)
2. Clone this repo to your local machine

   ```sh
   git clone https://github.com/PalisadoesFoundation/talawa-api
   cd talawa-api
   ```

3. Create `.env` file in the root directory of the project
   `.env` file is used to store the secret or environment variables.

   ```sh
   touch .env
   ```

4. Copy the `.env.sample` to `.env`

5. Fill out the following fields:
   - ACCESS_TOKEN_SECRET
   - REFRESH_TOKEN_SECRET
   - MONGO_DB_URL
     Follow instructions in the comments at the top of `.env`
6. Run the following commands

   ```sh
   sudo docker-compose build
   sudo docker-compose up
   ```

## Standard Installation

1. Install these dependencies if you don't already have them
   - [MongoDB](https://docs.mongodb.com/manual/administration/install-community/)
   - [Nodejs](https://nodejs.org/en/)
2. Clone this repo to your local machine

   ```sh
   git clone https://github.com/PalisadoesFoundation/talawa-api
   cd talawa-api
   npm install
   ```

3. Create `.env` file in the root directory of the project
   `.env` file is used to store the secret or environment variables.

   ```sh
   touch .env
   ```

4. Copy the `.env.sample` to `.env`

5. Fill out the following fields:
   - ACCESS_TOKEN_SECRET
   - REFRESH_TOKEN_SECRET
   - MONGO_DB_URL
     Follow instructions in the comments at the top of `.env`
6. Run the following commands

   ```sh
   npm run start
   ```

## Testing

```sh
npm run test
```

### Standard Installation vs Docker

Docker downloads a lot of large images, if you are short on storage or with slow internet connection prefer using standard development installation.
