---
id: installation
title: Installation
slug: /installation
sidebar_position: 1
---

This document provides instructions on how to set up and start a running instance of talawa-api on your local system. The instructions are written to be followed in sequence so make sure to go through each of them step by step without skipping any sections.

## The .env Configuration File

You will need to configure the API to work correctly.

1. The configuration file is called `.env` and must be placed in the root directory of the code.
1. This table defines some the parameters required for smooth operation
   1. Steps explaining the usage of the `.env` file will be found in subsequent sections

- **NOTE:** Visit our [Environment Variables Page](./environment-variables.md) for a comprehensive list of possibilities.

| **Variable**                           | **Use Case**                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `API_ADMINISTRATOR_USER_EMAIL_ADDRESS` | Email address of the administrator user.                                                                              |
| `API_ADMINISTRATOR_USER_NAME`          | Username of the administrator user, used for admin login and identification.                                          |
| `API_ADMINISTRATOR_USER_PASSWORD`      | Password for the administrator user, used for admin login security.                                                   |
| `API_BASE_URL`                         | Base URL for the API, used for constructing API endpoints and routing requests.                                       |
| `API_COMMUNITY_FACEBOOK_URL`           | URL to the community's Facebook page, used for linking and integrating social media presence.                         |
| `API_COMMUNITY_GITHUB_URL`             | URL to the community's GitHub repository, used for linking and integrating code repository.                           |
| `API_COMMUNITY_INSTAGRAM_URL`          | URL to the community's Instagram page, used for linking and integrating social media presence.                        |
| `API_COMMUNITY_LINKEDIN_URL`           | URL to the community's LinkedIn page, used for linking and integrating social media presence.                         |
| `API_COMMUNITY_NAME`                   | Name of the community, used for branding and identification within the application.                                   |
| `API_COMMUNITY_REDDIT_URL`             | URL to the community's Reddit page, used for linking and integrating social media presence.                           |
| `API_COMMUNITY_SLACK_URL`              | URL to the community's Slack workspace, used for linking and integrating communication channels.                      |
| `API_COMMUNITY_WEBSITE_URL`            | URL to the community's website, used for linking and integrating online presence.                                     |
| `API_COMMUNITY_X_URL`                  | URL to the community's X (formerly Twitter) page, used for linking and integrating social media presence.             |
| `API_COMMUNITY_YOUTUBE_URL`            | URL to the community's YouTube channel, used for linking and integrating video content.                               |
| `API_JWT_SECRET`                       | Secret key for JWT(JSON Web Token) generation and validation, used for securing API authentication and authorization. |
| `API_MINIO_SECRET_KEY`                 | Secret key for MinIO, used for securing access to MinIO object storage.                                               |
| `API_POSTGRES_PASSWORD`                | Password for the PostgreSQL database, used for database authentication and security.                                  |
| `CADDY_TALAWA_API_DOMAIN_NAME`         | Domain name for the Talawa API, used for configuring and routing API traffic.                                         |
| `CADDY_TALAWA_API_EMAIL`               | Email address for the Talawa API, used for SSL certificate registration and notifications.                            |
| `MINIO_ROOT_PASSWORD`                  | Root password for MinIO, used for securing administrative access to MinIO object storage.                             |
| `POSTGRES_PASSWORD`                    | Password for the PostgreSQL database (Docker Compose), used for database authentication and security.                 |

## Prerequisities

You must follow these steps before continuing.

#### Install Docker

Docker is used to build, deploy, and manage applications within isolated, lightweight containers, effectively packaging an application with all its dependencies so it can run consistently across different environments, allowing for faster development, testing, and deployment of software.

We use Docker to simplify installation. Follow these steps to install Docker on your system

1. [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop)
2. [Docker Engine for Linux](https://docs.docker.com/engine/install/)

After docker is installed, you'll need to verify its operation

1. Open a terminal window.
2. Run the following commands to check if the required software is installed:
   - `docker --version`
   - `docker-compose --version`
3. Check if docker is running:

   - `docker info`

_(Note: Restart the docker if you are getting this error `Cannot connect to the Docker daemon `)_

#### Download the `talawa-api` Code

1. On your computer, navigate to the folder where you want to set up the repository.
2. Open a command prompt (`cmd` for Windows) or terminal (`terminal` for Linux or MacOS) session in this folder.
   - You can usually do this by right-clicking in the folder and selecting the appropriate option for your OS.
3. Clone the repository to your local computer:
   ```bash
   git clone https://github.com/PalisadoesFoundation/talawa-api.git
   cd talawa-api
   git checkout develop-postgres
   ```

## Production Environment Setup

This section outlines how to setup Talawa-API for use by organizations.

If you are a developer, please go to the `Development Environment Setup` section

### Prerequisites

You must have basic competence and experience in the following technologies to be able to set up the production environment of talawa api:

1. Git
2. Github
3. Docker
4. Docker compose

Please make sure that you have insalled the required software before starting the production environment setup.

### Setup - Instructional Video

We provide a mostly automated way of setting up the production environment for the Talawa API using Git, Docker, and Docker-compose. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Production](https://img.youtube.com/vi/10Zi2srGPHM/0.jpg)](https://www.youtube.com/watch?v=10Zi2srGPHM)

**Note: The video contains some inaccuracies.**

1.  Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
2.  The correct branch to checkout is `develop-postgres`
3.  All the field for .env files are not shown in the video. Refer [Step 4: Configuring Environment Variables](##step-4-configuring-environment-variables)

### Setup - All Steps

Follow these steps to have the best experience

#### Configure the `.env` File

You'll need to create a `.env` file in the repository's root directory.

Copy the content of `./envFiles/.env.production` to the `.env` file.

```bash
cp ./envFiles/.env.production ./.env
```

##### Add a JWT Secret to .env

You will need to add a JWT secret to the `.env` file

1.  Open your web browser and go to [https://jwtsecret.com/generate](https://jwtsecret.com/generate).
2.  Select `64` from the slider.
3.  Click the **Generate** button.

Your new 64-character JWT secret will be displayed on the screen.

1. Copy this secret
2. Add it to the `API_JWT_SECRET` value in the `.env` file.

#### Start the App

1. Start the server by running the following command:
   ```bash
   docker compose up
   ```
2. To stop the Docker Server, use this command:
   ```bash
   docker compose down
   ```

Congratulations! 🎉 Your Talawa API is now successfully set up and running using Docker!

## Development Environment Setup

This section outlines how to setup Talawa-API for use by developers wanting to contribute code to the project.

If you want to install it for your organization, then please go to the `Production Environment Setup` section

### Our Recommendations

Linux based distributions are simply the best platform for a very vast majority of use cases related to software development. As such we recommend using popular linux based distributions like fedora, arch, ubuntu, linux mint, debian etc., for having a better experience during software development.

We make heavy use of Docker containers in our workflows. Since containers are a Linux-based technology, on non-Linux platforms they require Linux emulation through virtual machines, which can impact performance. So, you should be aware that there are performance penalties and certain limitations with running containers on platforms like macOS and windows.

Though, many of these penalties and limitations don't apply to windows subsystem for linux. So, if you plan on using windows, at the very least make use of windows subsystem for linux.

### Prerequisites

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

### Setup: Instructional Video

We provide a mostly automated way of setting up the development environment for the Talawa API using Git, Docker, and Visual Studio Code. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Development](https://img.youtube.com/vi/jz7koJIXqtk/0.jpg)](https://www.youtube.com/watch?v=jz7koJIXqtk)

**Note: The video contains some inaccuracies.**

1.  Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
2.  The correct branch to checkout is `develop-postgres`
3.  `postgres-test` is the name of the test database in the docker-compose file.

### Setup: Using the CLI

These steps are specific to Linux. You will need to modify them accordingly for other operating systems

1. Install `docker` and ensure that the daemon is running.
1. This process does not require the installation of PostgresSQL. If you have installed postgres on your system, make sure that it is not running.
1. Create the `.env` file by copying the template from the `envFiles/` directory.
   1. **DO NOT EDIT EITHER FILE!**
      ```bash
      cp envFiles/.env.devcontainer .env
      ```
1. Install the packages
   ```bash
   pnpm install
   ```
1. Install the `devcontainers/cli` package
   ```
   pnpm install -g @devcontainers/cli
   ```
1. You will now need to make your user a part of the `docker` operating system group or else you will get `permission denied` messages when starting docker later. `$USER` is a universal representation of your username. You don't need to change this in the command below.
   ```
   sudo usermod -a -G docker $USER
   ```
1. You will only become a part of the `docker` group on your next login. You don't have to logout, just start another session on the CLI using the `su` command.
   ```
   sudo su $USER -
   ```
1. Build the docker devcontainer
   ```
   devcontainer build --workspace-folder .
   ```
1. When the build is complete, the last line of the output should be:
   ```
   {"outcome":"success","imageName":"talawa-api"}
   ```
1. Start the docker devcontainer
   ```
   devcontainer up --workspace-folder .
   ```
1. When the startup is complete, the last line of out put should look like this:
   ```
   [19:53:14.063] INFO (166): Checking the connection to the postgres database.
   [19:53:14.077] INFO (166): Successfully connected to the postgres database.
   [19:53:14.077] INFO (166): Applying the drizzle migration files to the postgres database.
   [19:53:14.080] INFO (166): Successfully applied the drizzle migrations to the postgres database.
   [19:53:14.080] INFO (166): Checking the connection to the minio server.
   [19:53:14.087] INFO (166): Successfully connected to the minio server.
   [19:53:14.087] INFO (166): Checking if the "talawa" bucket exists in the minio server.
   [19:53:14.087] INFO (166): "talawa" bucket already exists in the minio server. Skipping, the bucket creation.
   [19:53:14.087] INFO (166): Checking if the administrator user already exists in the database.
   [19:53:14.089] INFO (166): Administrator user already exists in the database. Skipping, the administrator creation.
   [19:53:14.089] INFO (166): Checking if the community already exists in the database.
   [19:53:14.090] INFO (166): Community already exists in the database. Skipping, the community creation.
   [19:53:14.113] INFO (166): Server listening at http://127.0.0.1:4000
   [19:53:14.113] INFO (166): Server listening at http://172.23.0.3:4000
   [19:53:14.113] INFO (166): Server listening at http://172.20.0.2:4000
   [19:53:14.113] INFO (166): Server listening at http://172.19.0.3:4000
   [19:53:14.113] INFO (166): Server listening at http://172.21.0.3:4000
   [19:53:14.113] INFO (166): Server listening at http://172.22.0.4:4000
   ```

All done!

### Setup: Using the VScode IDE

You can setup the app using the VScode IDE. Here are the steps to follow:

1. Open cloned talawa-api project in Visual Studio Code.
1. Install the `devcontainer` extension in VScode.
1. You should see a notification that a `devcontainer` configuration file is available. Click on the notification and select `Reopen in Container`.
   - If you don't see the notification, you can open the command palette by pressing `Ctrl+Shift+P` and search for `Reopen in Container`.
   - Make sure you have downloaded `devcontainer` extension of vs code.
1. This will open a new Visual Studio Code window with the project running inside a Docker container. This will take a few minutes to complete.
1. Wait till the process is complete and you see ports being forwarded in the terminal.
1. You can check logs by clicking `Connecting to Dev Container (show log)`;
1. Create a new terminal in Visual Studio Code by pressing `` Ctrl+Shift+`  ``.
1. Run the `pwd` command to confirm you are in the `/home/talawa/api` directory.
1. Run the following command to check if the project has required dependencies installed correctly:
   ```bash
      node -v
      pnpm -v
   ```
   Congratulations! 🎉 Your Talawa API is now successfully set up and running using Docker and Vs code!

#### Development Mode Operation

You can run the app after closing the terminal or restating the vscode using these commands:

- for normal mode

```bash
    pnpm run start_development_server
```

- for debugging mode

```bash
    pnpm run start_development_server_with_debugger
```

**Note:** These commands will start the server in development mode.

## Testing and Validation

Please refer to the [Testing and Validation Page](../developer-resources/testing.md) for more details
