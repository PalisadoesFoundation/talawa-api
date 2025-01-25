# Table of Contents

1. [Talawa-API Installation](#talawa-api-installation)
2. [Development environment setup](#development-environment-setup)
   1. [Our recommendations](#our-recommendations)
   2. [Prerequisites](#prerequisites)
   3. [Setup using Instructional Video](#setup-using-instructional-video)
   4. [Step-by-Step Guide for Setup](#step-by-step-guide-for-setup)
      - [Step 1: Setting up the `talawa-api` Repository for Development](#step-1-setting-up-the-talawa-api-repository-for-development)
      - [Step 2: Check all the required software is installed](#step-2-check-all-the-required-software-is-installed)
      - [Step 3: Setting up the development environment](#step-3-setting-up-the-development-environment)
      - [To run backend after closing the terminal or restarting the vscode](#to-run-backend-after-closing-the-terminal-or-restating-the-vscode)
   5. [How to use the API](#how-to-use-the-api)
      - [For Talawa-API Developers](#for-talawa-api-developers)
      - [For Talawa-Admin Developers](#for-talawa-admin-developers)
   6. [Accessing the PostgreSQL Database using CloudBeaver](#accessing-the-postgresql-database-using-cloudbeaver)
   7. [Accessing the PostgreSQL test Database using CloudBeaver](#accessing-the-postgresql-test-database-using-cloudbeaver)
   8. [Accessing MinIO](#accessing-the-minio)
   9. [Accessing MinIO Test](#accessing-the-minio-test)
3. [Production environment setup](#production-environment-setup)
   1. [Prerequisites](#prerequisites)
   2. [Setup using Instructional Video](#setup-using-instructional-video)
   3. [Step-by-Step Guide for Setup](#step-by-step-guide-for-setup)
      - [Step 1: Check all the required software is installed](#step-1-check-all-the-required-software-is-installed)
      - [Step 2: Setting up the `talawa-api` Repository for Production](#step-2-setting-up-the-talawa-api-repository-for-production)
      - [Step 3: Creating env file](#step-3-creating-env-file)
      - [Step 4: Configuring Environment Variables](#step-4-configuring-environment-variables)
      - [Step 5: Using Docker to Install and Start the Server](#step-5-using-docker-to-install-and-start-the-server)
   4. [Using curl to test the API for production environment](#using-curl-to-test-the-api-for-production-environment)
      - [1. Sign-in API](#1-sign-in-api)
      - [2. Create Organization API](#2-create-organization-api)


# Talawa-API Installation

This document provides instructions on how to set up and start a running instance of talawa-api on your local system. The instructions are written to be followed in sequence so make sure to go through each of them step by step without skipping any sections.

# Development environment setup

## Our recommendations

Linux based distributions are simply the best platform for a very vast majority of use cases related to software development. As such we recommend using popular linux based distributions like fedora, arch, ubuntu, linux mint, debian etc., for having a better experience during software development.

We make heavy use of Docker containers in our workflows. Since containers are a Linux-based technology, on non-Linux platforms they require Linux emulation through virtual machines, which can impact performance. So, you should be aware that there are performance penalties and certain limitations with running containers on platforms like macOS and windows.

Though, many of these penalties and limitations don't apply to windows subsystem for linux. So, if you plan on using windows, at the very least make use of windows subsystem for linux.

## Prerequisites

You must have basic competence and experience in the following technologies to be able to set up and work within the development environment of talawa api:

1. Unix based operating systems like linux based distributions, macOS or windows subsystem for linux.
2. Git
3. Github
4. Docker
5. Docker compose
6. Visual studio code with devcontainers
7. Typescript
8. Node.js

It is very important that you go through [this](https://code.visualstudio.com/docs/devcontainers/containers) official documentation for working with devcontainers in visual studio code.


## Setup using Instructional Video

We provide a mostly automated way of setting up the development environment for the Talawa API using Git, Docker, and Visual Studio Code. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Development](https://img.youtube.com/vi/jz7koJIXqtk/0.jpg)](https://www.youtube.com/watch?v=jz7koJIXqtk)

**Note: The video contains some inaccuracies.**

   1. Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
   2. The correct branch to checkout is `develop-postgres`
   3. `postgres-test` is the name of the test database in the docker-compose file. 

## Step-by-Step Guide for Setup


### Step 1: Setting up the `talawa-api` Repository for Development

1. On your computer, navigate to the folder where you want to set up the repository.
2. Open a command prompt (`cmd` for Windows) or terminal (`terminal` for Linux or MacOS) session in this folder.
   - You can usually do this by right-clicking in the folder and selecting the appropriate option for your OS.
3. Clone the repository to your local computer:
   ```bash
   git clone https://github.com/PalisadoesFoundation/talawa-api.git
   cd talawa-api
   git checkout develop-postgres
   ```
   - **Note:** Make sure to check out the `develop-postgres` branch

### Step 2: Check all the required software is installed

1. Open a terminal window.
2. Run the following commands to check if the required software is installed:
   - `docker --version`
   - `docker-compose --version`
   - `code --version`

3. Check if docker is running:
   - `docker info` 
   
   *(Note: Restart the docker if you are getting this error `Cannot connect to the Docker daemon `)*

### Step 3: Setting up the development environment

1. Open cloned talawa-api project in Visual Studio Code.
2. You should see a notification that a `devcontainer` configuration file is available. Click on the notification and select `Reopen in Container`.
   - If you don't see the notification, you can open the command palette by pressing `Ctrl+Shift+P` and search for `Reopen in Container`.
   - Make sure you have downloaded `devcontainer` extension of vs code.
3. This will open a new Visual Studio Code window with the project running inside a Docker container. This will take a few minutes to complete.
4. Wait till the process is complete and you see ports being forwarded in the terminal.
5. You can check logs by clicking `Connecting to Dev Container (show log)`;
6. Create a new terminal in Visual Studio Code by pressing `` Ctrl+Shift+`  ``.
7. Run the `pwd` command to confirm you are in the `/home/talawa/api` directory.
8. Run the following command to check if the project has required dependencies installed correctly:
   ```bash
      node -v
      pnpm -v
   ```
   Congratulations! 🎉 Your Talawa API is now successfully set up and running using Docker and Vs code!

### To run backend after closing the terminal or restating the vscode.

- for normal mode

```bash
    pnpm run start_development_server
```

- for debugging mode

```bash
    pnpm run start_development_server_with_debugger
```

**Note:** These command will start the server in development mode.

## How to use the API

These are some important URLs for coding and troubleshooting :

### For Talawa-API Developers


1. By default talawa-api runs on port 4000. It is available on the following endpoint:

   ```
   http://127.0.0.1:4000
   ```

2. The url for accessing the GraphQL Playground is
   ```bash
   http://127.0.0.1:4000/graphiql
   ```
3. The graphQL endpoint for handling `queries` and `mutations` is this:

   ```
   http://127.0.0.1:4000/graphql/
   ```
   - If you navigate to the endpoint you and see a JSON response like this.
      ```json
         {"data":null,"errors":[{"message":"Unknown query"}]}
      ```

4. GraphQL endpoint for handling `subscriptions` is this:

   ```
   ws://127.0.0.1:4000/graphql/
   ```

### For Talawa-Admin Developers

The Organization URL for Talawa mobile app developers to use is:

```
http://127.0.0.1:4000/graphql/
```

## Accessing the PostgreSQL Database using cloudBeaver

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:8978/
   ```
2. Log in to the CloudBeaver UI using the following credentials (these credentials can be modified in the `.env.devcontainer` file by changing the `CLOUDBEAVER_ADMIN_NAME` and `CLOUDBEAVER_ADMIN_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the CloudBeaver UI. Click on the "New Connection" button and select `PostgreSQL` from the list of available connections.
4. Fill in the connection details as follows:

   - Name: `talawa`
   - Host: `postgres`
   - Port: `5432`
   - Database: `talawa`
   - Username: `talawa`
   - Password: `password`

   **Note: The host name should match the one specified in the Docker Compose file and credentials should match those specified in the `.env.development` file.**

5. Check the `Save credentials for all users with access` option to avoid entering the credentials each time.
6. Check the following boxes in the Database list:
   - Show all databases
   - Show template databases
   - Show unavailable databases
   - Show database statistics
7. Click `Create` to save the connection.
8. You should now see the `PostgreSql@postgres` connection in the list of available connections. Click on the connection to open the database.
9. Navigate to `PostgreSql@postgres > Databases > talawa > Schemas > public > Tables` to view the available schemas.

## Accessing the PostgreSQL test Database using cloudBeaver
1. Click on the `New Connection` button and select `PostgreSQL` from the list of available connections.
2. Fill in the connection details as follows:

    - Name: `talawa`
    - Host: `postgres-test`
    - Port: `5432`
    - Database: `talawa`
    - Username: `talawa`
    - Password: `password`

    **Note: The host name should match the one specified in the Docker Compose file and credentials should match those specified in the `.env.development` file.**

3. Check the `Save credentials for all users with access` option to avoid entering the credentials each time.
4. Check the following boxes in the Database list:
      - Show all databases
      - Show template databases
      - Show unavailable databases
      - Show database statistics

5. Click `Create` to save the connection.
6. You should now see the `PostgreSql@postgres-test` connection in the list of available connections. Click on the connection to open the database.
7. Navigate to `PostgreSql@postgres-test > Databases > talawa > Schemas > public > Tables` to view the available tables.

## Accessing the MinIo

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9001/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the env files by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.

## Accessing the MinIO Test

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9003/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the `.env.devcontainer` file by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.


# Production environment setup

## Prerequisites

You must have basic competence and experience in the following technologies to be able to set up the production environment of talawa api:

1. Git
2. Github
3. Docker
4. Docker compose

Please make sure that you have insalled the required software before starting the production environment setup.

## Setup using Instructional Video

We provide a mostly automated way of setting up the production environment for the Talawa API using Git, Docker, and Docker-compose. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Production](https://img.youtube.com/vi/10Zi2srGPHM/0.jpg)](https://www.youtube.com/watch?v=10Zi2srGPHM)

**Note: The video contains some inaccuracies.**

   1. Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
   2. The correct branch to checkout is `develop-postgres`
   3. All the field for .env files are not shown in the video. Refer [Configuring env file](###Step 4:-Configuring-Environment-Variables)

## Step-by-Step Guide for Setup

### Step 1: Check all the required software is installed

1. Open a terminal window.
2. Run the following commands to check if the required software is installed:
   - `docker --version`
   - `docker-compose --version`
3. Check if docker is running:
   - `docker info` 
   
   *(Note: Restart the docker if you are getting this error `Cannot connect to the Docker daemon `)*

### Step 2: Setting up the `talawa-api` Repository for Production

1. On your computer, navigate to the folder where you want to set up the repository.
2. Open a command prompt (`cmd` for Windows) or terminal (`terminal` for Linux or MacOS) session in this folder.
   - You can usually do this by right-clicking in the folder and selecting the appropriate option for your OS.
3. Clone the repository to your local computer:
   ```bash
   git clone https://github.com/PalisadoesFoundation/talawa-api.git
   cd talawa-api
   git checkout develop-postgres
   ```
   - **Note:** Make sure to check out the `develop-postgres` branch

### Step 3: Creating env file

1. **Option 1:** Manually create the file and copy the content.

   - Create a new file named `.env` in the root folder.
   - Copy the content of `./envFiles/.env.production` to the `.env` file.

2. **Option 2:** Run the command to automate the process.
   - Execute the following command in your terminal:
     ```bash
     cp ./envFiles/.env.production ./.env
     ```

Choose whichever method suits you best!

### Step 4: Configuring Environment Variables

Populate the following variables in your `.env` file:

| **Variable**                           | **Use Case**                                                                                                         |
|----------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `API_ADMINISTRATOR_USER_EMAIL_ADDRESS` | Email address of the administrator user.                                                                             |
| `API_ADMINISTRATOR_USER_NAME`          | Username of the administrator user, used for admin login and identification.                                         |
| `API_ADMINISTRATOR_USER_PASSWORD`      | Password for the administrator user, used for admin login security.                                                  |
| `API_BASE_URL`                         | Base URL for the API, used for constructing API endpoints and routing requests.                                      |
| `API_COMMUNITY_FACEBOOK_URL`           | URL to the community's Facebook page, used for linking and integrating social media presence.                        |
| `API_COMMUNITY_GITHUB_URL`             | URL to the community's GitHub repository, used for linking and integrating code repository.                          |
| `API_COMMUNITY_INSTAGRAM_URL`          | URL to the community's Instagram page, used for linking and integrating social media presence.                       |
| `API_COMMUNITY_LINKEDIN_URL`           | URL to the community's LinkedIn page, used for linking and integrating social media presence.                        |
| `API_COMMUNITY_NAME`                   | Name of the community, used for branding and identification within the application.                                  |
| `API_COMMUNITY_REDDIT_URL`             | URL to the community's Reddit page, used for linking and integrating social media presence.                          |
| `API_COMMUNITY_SLACK_URL`              | URL to the community's Slack workspace, used for linking and integrating communication channels.                     |
| `API_COMMUNITY_WEBSITE_URL`            | URL to the community's website, used for linking and integrating online presence.                                    |
| `API_COMMUNITY_X_URL`                  | URL to the community's X (formerly Twitter) page, used for linking and integrating social media presence.            |
| `API_COMMUNITY_YOUTUBE_URL`            | URL to the community's YouTube channel, used for linking and integrating video content.                              |
| `API_JWT_SECRET`                       | Secret key for JWT(JSON Web Token) generation and validation, used for securing API authentication and authorization.|
| `API_MINIO_SECRET_KEY`                 | Secret key for MinIO, used for securing access to MinIO object storage.                                              |
| `API_POSTGRES_PASSWORD`                | Password for the PostgreSQL database, used for database authentication and security.                                 |
| `CADDY_TALAWA_API_DOMAIN_NAME`         | Domain name for the Talawa API, used for configuring and routing API traffic.                                        |
| `CADDY_TALAWA_API_EMAIL`               | Email address for the Talawa API, used for SSL certificate registration and notifications.                           |
| `MINIO_ROOT_PASSWORD`                  | Root password for MinIO, used for securing administrative access to MinIO object storage.                            |
| `POSTGRES_PASSWORD`                    | Password for the PostgreSQL database (Docker Compose), used for database authentication and security.                |

- Steps to Create a JWT Secret

   1. Open your web browser and go to [https://jwtsecret.com/generate](https://jwtsecret.com/generate).
   2. Select `64` from the slider.
   4. Click the **Generate** button.

Your new 64-character JWT secret will be displayed on the screen. Copy this secret and use it in your configuration.


### Step 5: Using Docker to Install and Start the Server

1. Start the server by running the following command:
   ```bash
   docker compose up
   ```
2. To stop the Docker Server, use this command:
   ```bash
   docker compose down
   ```
   Congratulations! 🎉 Your Talawa API is now successfully set up and running using Docker!

## Using curl to test the API for production environment

**Important:** Use the API URLs that were configured during the production environment setup. we will be using example URLs in the following examples.

### 1. Sign-in API

**Description:** This endpoint is used to sign in a user.

**Request:**

```bash

curl -X POST -H "Content-Type: application/json" -k <API_BASE_URL> -d '{
  "query": "query signIn($input: QuerySignInInput!) { signIn(input: $input) { authenticationToken user { emailAddress id name } } }",
  "variables": {
    "input": {
      "emailAddress": "administrator@email.com",
      "password": "password"
    }
  }
}' 

```

**Request Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "query": "query signIn($input: QuerySignInInput!) { signIn(input: $input) { authenticationToken user { emailAddress id name } } }",
  "variables": {
    "input": {
      "emailAddress": "administrator@email.com",
      "password": "password"
    }
  }
}
```

**Response:**

- Returns the authentication token and user details (email address, id, and name).

### 2. Create Organization API

**Description:** This endpoint is used to create a new organization.

Request:

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your_token>" -k  <API_BASE_URL> -d '{
  "query": "mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) { createOrganization(input: $input) { id name } }",
  "variables": {
    "input": {
      "name": "name0"
    }
  }
}'
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <your_token>`

**Request Body:**

```json
{
  "query": "mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) { createOrganization(input: $input) { id name } }",
  "variables": {
    "input": {
      "name": "name0"
    }
  }
}
```

**Response:**
-Returns the newly created organization's ID and name.
