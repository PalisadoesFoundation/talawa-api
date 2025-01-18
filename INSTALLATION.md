# Table of Contents

1. [Talawa-API Installation](#talawa-api-installation)
2. [Development environment setup](#development-environment-setup)
   1. [Our recommendations](#our-recommendations)
   2. [Prerequisites](#prerequisites)
      1. [Install git and github](#install-git-and-github)
      2. [Install and Configure Docker](#install-and-configure-docker)
         1. [For Windows / macOS](#for-windows--macos)
         2. [For Linux](#for-linux)
      3. [Install Visual Studio Code and install Extensions](#install-visual-studio-code-and-install-extensions)
      4. [Install node.js](#install-nodejs)
      5. [Install TypeScript](#install-typescript)
   3. [Setup using Instructional Video](#setup-using-instructional-video)
   4. [Step-by-Step Guide for Setup](#step-by-step-guide-for-setup)
      1. [Step 1: Check all the required software is installed](#step-1-check-all-the-required-software-is-installed)
      2. [Step 2: Setting up this repository](#step-2-setting-up-this-repository)
      3. [Step 3: Setting up the development environment](#step-3-setting-up-the-development-environment)
      4. [Step 4: Configuring Environment Variables](#step-4-configuring-environment-variables)
3. [Production environment setup](#production-environment-setup)
   1. [Prerequisites](#prerequisites-1)
      1. [Install git and github](#install-git-and-github-1)
      2. [Install and Configure Docker](#install-and-configure-docker-1)
         1. [For Windows / macOS](#for-windows--macos-1)
         2. [For Linux](#for-linux-1)
   2. [Setup using Instructional Video](#setup-using-instructional-video-1)
   3. [Step-by-Step Guide for Setup](#step-by-step-guide-for-setup-1)
      1. [Step 1: Check all the required software is installed](#step-1-check-all-the-required-software-is-installed-1)
      2. [Step 2: Setting up the `talawa-api` Repository for Production](#step-2-setting-up-the-talawa-api-repository-for-production)
      3. [Step 3: Creating env file](#step-3-creating-env-file)
      4. [Step 4: Configuring Environment Variables](#step-4-configuring-environment-variables)
      5. [Step 5: Using Docker to Install and Start the Server](#step-5-using-docker-to-install-and-start-the-server)
   4. [Commands to run the production server after closing the terminal, if docker containers are running.](#commands-to-run-the-production-server-after-closing-the-terminal-if-docker-containers-are-running)
4. [How to use the API](#how-to-use-the-api)
   1. [For Talawa-API Developers](#for-talawa-api-developers)
   2. [For Mobile App Developers](#for-mobile-app-developers)
      1. [On Android Virtual Device](#on-android-virtual-device)
      2. [On a Real Mobile Device](#on-a-real-mobile-device)
   3. [For Talawa-Admin Developers](#for-talawa-admin-developers)
5. [Accessing the PostgreSQL Database and PostgreSQL test Database](#accessing-the-postgresql-database-and-postgresql-test-database)
6. [Accessing the MinIo](#accessing-the-minio)
7. [Accessing the MinIO Test](#accessing-the-minio-test)
8. [Using curl to test the API for production environment](#using-curl-to-test-the-api-for-production-environment)
   1. [1. Sign-in API](#1-sign-in-api)
   2. [2. Create Organization API](#2-create-organization-api)

# Talawa-API Installation

This document provides instructions on how to set up and start a running instance of talawa-api on your local system. The instructions are written to be followed in sequence so make sure to go through each of them step by step without skipping any sections.

# Development environment setup

## Our recommendations

Linux based distributions are simply the best platform for a very vast majority of use cases related to software development. As such we recommend using popular linux based distributions like fedora, arch, ubuntu, linux mint, debian etc., for having a better experience during software development.

We make heavy of use docker containers in our workflows. Since, containers are a technology built on top of linux, on non-linux platforms they can only be used by emulating linux where they are ran inside linux based virtual machines. So, you should be aware that there are performance penalties and certain limitations with running containers on platforms like macOS and windows.

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

In this section we'll explain how to set up all the prerequisite software packages mentioned above to get you up and running.

### Install git and github

The easiest way to get the latest copies of our code is to install the `git` package on your computer.

Follow the setup guide for `git` on official [git docs](https://git-scm.com/downloads). Basic `git` knowledge is required for open source contribution so make sure you're comfortable with it. [Here's](https://youtu.be/apGV9Kg7ics) a good tutorial to get started with `git` and `github`.

### Install and Configure Docker

#### For Windows / macOS:

1. **Install [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop).**
2. **WSL on Windows:**
   - Right-click on the Docker taskbar item and select **Settings**.
   - Check **Use the WSL 2 based engine**.
   - Verify your distribution is enabled under **Resources > WSL Integration**.

#### For Linux:

1. **Install [Docker CE/EE](https://docs.docker.com/engine/install/):**
   - Follow the official install instructions for your distribution.
2. **Install Docker Compose:** (if you are using it)
   - Follow the [Docker Compose directions](https://docs.docker.com/compose/install/).
3. **Add your user to the docker group:**
   - Use a terminal to run: `sudo usermod -aG docker $USER`
   - Sign out and back in again so your changes take effect.

### Install Visual Studio Code and install Extensions

1. Install [Visual Studio Code](https://code.visualstudio.com/)

2. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension:
   - Open Visual Studio Code.
   - Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
   - Search for `Dev Containers` and click **Install**.
   - Alternatively, you can use the command line:
     ```sh
     code --install-extension ms-vscode-remote.remote-containers
     ```
3. It is very important that you go through [this](https://code.visualstudio.com/docs/devcontainers/containers) official documentation for working with devcontainers in visual studio code.

### Install node.js

Best way to install and manage `node.js` is making use of node version managers. We recommend using `fnm`, which will be described in more detail later.

Follow these steps to install the `node.js` packages in Windows, Linux and MacOS.

1. For Windows:
   1. first install `node.js` from their website at https://nodejs.org
      1. When installing, don't click the option to install the `necessary tools`. These are not needed in our case.
   2. then install [fnm](https://github.com/Schniz/fnm). Please read all the steps in this section first.
      1. All the commands listed on this page will need to be run in a Windows terminal session in the `talawa-api` directory.
      2. Install `fnm` using the `winget` option listed on the page.
      3. Setup `fnm` to automatically set the version of `node.js` to the version required for the repository using these steps:
         1. First, refer to the `fnm` web page's section on `Shell Setup` recommendations.
         2. Open a `Windows PowerShell` terminal window
         3. Run the recommended `Windows PowerShell` command to open `notepad`.
         4. Paste the recommended string into `notepad`
         5. Save the document.
         6. Exit `notepad`
         7. Exit PowerShell
         8. This will ensure that you are always using the correct version of `node.js`
2. For Linux and MacOS, use the terminal window.
   1. install `node.js`
   2. then install `fnm`
      1. Refer to the installation page's section on the `Shell Setup` recommendations.
      2. Run the respective recommended commands to setup your node environment
      3. This will ensure that you are always using the correct version of `node.js`

### Install TypeScript

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional types, classes, and modules to JavaScript, and supports tools for large-scale JavaScript applications.

To install TypeScript, you can use the `npm` command which comes with `node.js`:

```bash
npm install -g typescript
```

This command installs TypeScript globally on your system so that it can be accessed from any project.

## Setup using Instructional Video

We provide a mostly automated way of setting up the development environment for the Talawa API using Git, Docker, and Visual Studio Code. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Development](https://img.youtube.com/vi/jz7koJIXqtk/0.jpg)](https://www.youtube.com/watch?v=jz7koJIXqtk)

**Note: The video contains some inaccuracies.**

    1. Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
    2. The correct branch to checkout is `develop-postgres`
    3. postgres-test is the name of the test database in the docker-compose file.

## Step-by-Step Guide for Setup

### Step 1: Check all the required software is installed

1. Open a terminal window.
2. Run the following commands to check if the required software is installed:
   - `git --version`
   - `docker --version`
   - `docker-compose --version`
   - `code --version`
   - `node --version`
   - `npm --version`
   - `fnm --version`
   - `tsc --version`
3. Check if docker is running:
   - `docker info`

### Step 2: Setting up this repository

First you need a local copy of `talawa-api`. Run the following command in the directory of choice on your local system.

1. On your computer, navigate to the folder where you want to setup the repository.
2. Open a `cmd` (Windows) or `terminal` (Linux or MacOS) session in this folder.
   1. An easy way to do this is to right-click and choose appropriate option based on your OS.
3. **For Our Open Source Contributor Software Developers:**

   1. Next, we'll fork and clone the `talawa-api` repository.
   2. In your web browser, navigate to [https://github.com/PalisadoesFoundation/talawa-api/](https://github.com/PalisadoesFoundation/talawa-api/) and click on the `fork` button. It is placed on the right corner opposite the repository name `PalisadoesFoundation/talawa-api`.

      ![Image with fork](public/markdown/images/install1.png)

   3. You should now see `talawa-api` under your repositories. It will be marked as forked from `PalisadoesFoundation/talawa-api`

      ![Image of user's clone](public/markdown/images/install2.png)

   4. Clone the repository to your local computer (replacing the values in `{{}}`):
      ```bash
      $ git clone https://github.com/{{YOUR GITHUB USERNAME}}/talawa-api.git
      cd talawa-api
      git checkout develop-postgres
      ```
      - **Note:** Make sure to check out the `develop-postgres` branch
   5. You now have a local copy of the code files.

### Step 3: Setting up the development environment

1. Open cloned talawa-api project in Visual Studio Code.
2. You should see a notification that a `devcontainer` configuration file is available. Click on the notification and select `Reopen in Container`.
   - If you don't see the notification, you can open the command palette by pressing `Ctrl+Shift+P` and search for `Reopen in Container`.
3. This will open a new Visual Studio Code window with the project running inside a Docker container. This will take a few minutes to complete.
4. Wait till the process is complete and you see ports being forwarded in the terminal.
5. You can check logs by clicking `Connecting to Dev Container (show log)`;
6. Create a new terminal in Visual Studio Code by pressing `` Ctrl+Shift+`  ``.
7. Run the `pwd` command to confirm you are in the `/home/talawa/api` directory.
8. Run the following command to check if the project has required dependencies:
   `bash
node -v
pnpm -v
`
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

# Production environment setup

## Prerequisites

You must have basic competence and experience in the following technologies to be able to set up the production environment of talawa api:

1. Git
2. Github
3. Docker
4. Docker compose

In this section we'll explain how to set up all the prerequisite software packages mentioned above to get you up and running.

### Install git and github

The easiest way to get the latest copies of our code is to install the `git` package on your computer.

Follow the setup guide for `git` on official [git docs](https://git-scm.com/downloads). Basic `git` knowledge is required for open source contribution so make sure you're comfortable with it. [Here's](https://youtu.be/apGV9Kg7ics) a good tutorial to get started with `git` and `github`.

### Install and Configure Docker

#### For Windows / macOS:

1. **Install [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop).**
2. **WSL on Windows:**
   - Right-click on the Docker taskbar item and select **Settings**.
   - Check **Use the WSL 2 based engine**.
   - Verify your distribution is enabled under **Resources > WSL Integration**.

#### For Linux:

1. **Install [Docker CE/EE](https://docs.docker.com/engine/install/):**
   - Follow the official install instructions for your distribution.
2. **Install Docker Compose:** (if you are using it)
   - Follow the [Docker Compose directions](https://docs.docker.com/compose/install/).
3. **Add your user to the docker group:**
   - Use a terminal to run: `sudo usermod -aG docker $USER`
   - Sign out and back in again so your changes take effect.

## Setup using Instructional Video

We provide a mostly automated way of setting up the development environment for the Talawa API using Git, Docker, and Visual Studio Code. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Production](https://img.youtube.com/vi/10Zi2srGPHM/0.jpg)](https://www.youtube.com/watch?v=10Zi2srGPHM)

**Note: The video contains some inaccuracies.**

    1. Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
    2. The correct branch to checkout is `develop-postgres`

## Step-by-Step Guide for Setup

### Step 1: Check all the required software is installed

1. Open a terminal window.
2. Run the following commands to check if the required software is installed:
   - `git --version`
   - `docker --version`
   - `docker-compose --version`
3. Check if docker is running:
   - `docker info`

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

    1. **CADDY_TALAWA_API_DOMAIN_NAME** (e.g., `localhost`)
    2. **CADDY_TALAWA_API_EMAIL** (e.g., `administrator@email.com`)
    3. **API_POSTGRES_PASSWORD** (e.g., `password`)
    4. **API_BASE_URL** (e.g., `https://localhost`)
    5. **API_JWT_SECRET**

To generate a 64-character JWT secret, run this command in your terminal:

```bash
openssl rand -base64 64
```

### Step 5: Using Docker to Install and Start the Server

1. Start the server by running the following command:
   ```bash
   docker compose up
   ```
2. To stop the Docker Server, use this command:
   `bash
docker compose down
`
   Congratulations! 🎉 Your Talawa API is now successfully set up and running using Docker!

### Commands to run the production server after closing the terminal, if docker containers are running.

- for normal mode

```bash
    pnpm run start_production_server
```

- for debugging mode

```bash
    pnpm run start_production_server_with_debugger
```

**Note:** These command will start the server in production mode.

# How to use the API

## For Talawa-API Developers

**Important:** Use the API URLs that were configured during the production environment setup.

These are some important URLs for coding and troubleshooting :

1. By default talawa-api runs on `port 4000` on your system's localhost. It is available on the following endpoint:

   ```
   http://localhost:4000/
   ```

   - If you navigate to the endpoint you and see a `JSON` response like this it means talawa-api is running successfully:

     ```
     {"talawa-version":"v1","status":"healthy"}
     ```

2. The url for accessing the GraphQL Playground is
   ```bash
   http://localhost:4000/graphiql
   ```

## For Mobile App Developers

The Organization URL for Talawa mobile app developers will depend upon the device on which Mobile app is installed.

### On Android Virtual Device

If the Talawa Mobile App is installed on Android Virtual Device (AVD), use the following URL:

```
http://10.0.2.2:4000/graphql
```

### On a Real Mobile Device

If Talawa Mobile App is installed on a Real Mobile Device, follow the below steps to get URL:

1. Open Command Prompt in Windows, or Terminal in Linux/OSX
1. Enter `ipconfig` (For Windows Users) or `ifconfig` (For Linux/OSX Users)
1. Your Mobile and Computer (On which API server is running) must be on same Wifi Network. Use Mobile Hotspot to connect your computer to internet in case you don't have access to a Wifi Router.
1. Search for the `Wireless LAN adapter Wi-Fi:` and then copy the `IPv4 Address`
1. Now, use this IP address (`192.168.0.105` in our case) to access the API instance using the following URL pattern:

   ```
   http://{IP_Address}:4000/graphql
   ```

   For example:

   ```
   http://192.168.0.105:4000/graphql
   ```

## For Talawa-Admin Developers

The Organization URL for Talawa mobile app developers to use is:

```
http://localhost:4000/graphql/
```

# Accessing the PostgreSQL Database and PostgreSQL test Database

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
10. Again click on the `New Connection` button and select `PostgreSQL` from the list of available connections.
11. Fill in the connection details as follows:

    - Name: `talawa`
    - Host: `postgres-test`
    - Port: `5432`
    - Database: `talawa`
    - Username: `talawa`
    - Password: `password`

    **Note: The host name should match the one specified in the Docker Compose file and credentials should match those specified in the `.env.development` file.**

12. Check the `Save credentials for all users with access` option to avoid entering the credentials each time.
13. Click `Create` to save the connection.
14. You should now see the `PostgreSql@postgres-test` connection in the list of available connections. Click on the connection to open the database.
15. Navigate to `PostgreSql@postgres-test > Databases > talawa > Schemas > public > Tables` to view the available schemas.

# Accessing the MinIo

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9001/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the `.env.devcontainer` file by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.

# Accessing the MinIO Test

1. Open your preferred browser and navigate to:
   ```bash
   http://127.0.0.1:9003/
   ```
2. Log in to the MinIO UI using the following credentials(these credentials can be modified in the `.env.devcontainer` file by changing the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` variables):
   - Username: `talawa`
   - Password: `password`
3. You should now see the MinIO UI. Click on the `Login` button to access the MinIO dashboard.
4. You can now view the available buckets and objects in the MinIO dashboard.

# Using curl to test the API for production environment

**Important:** Use the API URLs that were configured during the production environment setup. we will be using example URLs in the following examples.

## 1. Sign-in API

Endpoint: **https://localhost/graphql**

**Description:** This endpoint is used to sign in a user.

**Request:**

```bash

curl -X POST -H "Content-Type: application/json" -k -d '{
  "query": "query signIn($input: QuerySignInInput!) { signIn(input: $input) { authenticationToken user { emailAddress id name } } }",
  "variables": {
    "input": {
      "emailAddress": "administrator@email.com",
      "password": "password"
    }
  }
}' https://localhost/graphql

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

## 2. Create Organization API

Endpoint: **https://localhost/graphql**

**Description:** This endpoint is used to create a new organization.

Request:

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your_token>" -k -d '{
  "query": "mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) { createOrganization(input: $input) { id name } }",
  "variables": {
    "input": {
      "name": "name0"
    }
  }
}' https://localhost/graphql
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
