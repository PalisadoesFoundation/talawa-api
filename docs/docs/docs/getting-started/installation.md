---
id: installation
title: Installation
slug: /installation
sidebar_position: 1
---

Installation is not difficult, but there are many steps. This is a brief explanation of what needs to be done:

1. Install `git`
2. Download the code from GitHub using `git`
3. Install `node.js` (Node), the runtime environment the application will need to work.
4. Configure the Node Package Manager (`pnpm`) to automatically use the correct version of Node for our application.
5. Use `pnpm` to install TypeScript, the language the application is written in.
6. Install other supporting software such as the database.
7. Configure the application
8. Start the application

These steps are explained in more detail in the sections that follow.

## Prerequisites

In this section we'll explain how to set up all the prerequisite software packages to get you up and running.

### Install git

The easiest way to get the latest copies of our code is to install the `git` package on your computer.

Follow the setup guide for `git` on official [git docs](https://git-scm.com/downloads). Basic `git` knowledge is required for open source contribution so make sure you're comfortable with it. [Here's](https://youtu.be/apGV9Kg7ics) a good tutorial to get started with `git` and `github`.

### Setting up this repository

First you need a local copy of `talawa-api`. Run the following command in the directory of choice on your local system.

1. On your computer, navigate to the folder where you want to setup the repository.
2. Open a `cmd` (Windows) or `terminal` (Linux or MacOS) session in this folder.
   1. An easy way to do this is to right-click and choose appropriate option based on your OS.

The next steps will depend on whether you are:

1. an end user installing our software (Production Environments) or
2. one of our open source contributors (Development Environments).

Please follow them closely.

#### For Production Environments

Follow the steps in this section if you are using Talawa-API as an end user.

1. Clone the repository to your local computer using this command:

   ```bash
   $ git clone https://github.com/PalisadoesFoundation/talawa-api.git
   ```

   1. Proceed to the next section.

#### For Development Environments

If you are one of our open source software developer contributors then
follow these steps carefully in forking and cloning the `talawa-api` repository.

1.  Follow the steps in our [Git Guide for Developers](https://developer.palisadoes.org/docs/git-guide/introduction/quickstart)
2.  As a developer you will be working with our `develop` branch.
3.  You will now have a local copy of the code files.
4.  For more detailed instructions on contributing code, please review the following documents in the root directory of the code:
    1. CONTRIBUTING.md
    2. CODE_OF_CONDUCT.md
    3. CODE_STYLE.md
    4. DOCUMENTATION.md
    5. INSTALLATION.md
    6. ISSUE_GUIDELINES.md
    7. PR_GUIDELINES.md

Proceed to the next section.

### Install node.js

The best way to install and manage `node.js` is making use of node version managers. We recommend using `fnm`, which will be described in more detail later.

Follow these steps to install the `node.js` packages in Windows, Linux and MacOS.

#### For Windows Users

Follow these steps:

1. Install `node.js` from their website at https://nodejs.org
   1. When installing, don't click the option to install the `necessary tools`. These are not needed in our case.
2. Install [fnm](https://github.com/Schniz/fnm). Please read all the steps in this section first.
   1. All the commands listed on this page will need to be run in a Windows terminal session in the `talawa-api` directory.
   2. Install `fnm` using the `winget` option listed on the page.
   3. Setup `fnm` to automatically set the version of `node.js` to the version required for the repository using these steps:
      1. Refer to the `Shell Setup` section of the `fnm` site's installation page for recommendations.
      2. Open a `Windows PowerShell` terminal window
      3. Run the recommended `Windows PowerShell` command to open `notepad`.
      4. Paste the recommended string into `notepad`
      5. Save the document.
      6. Exit `notepad`
      7. Exit PowerShell
      8. This will ensure that you are always using the correct version of `node.js`

Proceed to the next section.

#### For Linux and MacOS Users

Follow these steps:

1. Install `node.js` from their website at https://nodejs.org
2. Install [fnm](https://github.com/Schniz/fnm).
   1. Refer to the `Shell Setup` section of the `fnm` site's installation page for recommendations.
   2. Run the respective recommended commands to setup your node environment
   3. This will ensure that you are always using the correct version of `node.js`

Proceed to the next section.

### Install pnpm

The application uses `pnpm` to manage the various `node.js` packages that need to be installed.

- Install `pnpm` from the [pnpm website](https://pnpm.io/installation)

Proceed to the next section.

### Install TypeScript

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional types, classes, and modules to JavaScript, and supports tools for large-scale JavaScript applications.

To install TypeScript, you can use the `pnpm` command:

```bash
pnpm install -g typescript
```

This command installs TypeScript globally on your system so that it can be accessed from any project.

Proceed to the next section.

### Install The Required Packages

Run the following command to install the packages and dependencies required by the app:

```
pnpm install
```

The prerequisites are now installed. The next step will be to get the app up and running.

### Install Docker

Follow these steps to install Docker on your system:

1. The steps are different for Windows/Mac versus Linux users:
   1. [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop)
   2. [Docker Engine for Linux](https://docs.docker.com/engine/install/)

<<<<<<< HEAD
```
API_COMMUNITY_FACEBOOK_URL
API_COMMUNITY_GITHUB_URL
API_COMMUNITY_INSTAGRAM_URL
API_COMMUNITY_LINKEDIN_URL
API_COMMUNITY_REDDIT_URL
API_COMMUNITY_SLACK_URL
API_COMMUNITY_WEBSITE_URL
API_COMMUNITY_X_URL
API_COMMUNITY_YOUTUBE_URL
```
##### Update the Name of the Parent Organization / Community

You will need to update the `.env` file with the following information. 
```
API_COMMUNITY_NAME
```

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
4. Docker [rootless mode](https://docs.docker.com/engine/security/rootless/)
5. Docker compose
6. Visual studio code with devcontainers
7. Typescript
8. Node.js

It is very important that you go through [this](https://code.visualstudio.com/docs/devcontainers/containers) official documentation for working with devcontainers in visual studio code.

## Rootless Docker

Docker by default is installed with a daemon which runs with root. This is not ideal, since any containers which is started by this daemon is also root. This does not follow the [princible of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege). Instead it is recommended to use [Rootless Docker](https://docs.docker.com/engine/security/rootless/) instead runs as the current user and reduces the attack vector.


### Limitations:

Since rootless docker is unable to bind to ports > 1024, caddy instead binds to 8080 and 8443 as defined in envFiles/.env.rootles.devcontainer by default


### Important:
* DO NOT RUN AS ROOT. Ensure that your user is a non-root user, run `id` this should return a pid which is >= 1000, if your user is in the docker group, remove it.
* Unless specified any commands in this document is to be run without sudo as a non-root user
* Ensure that `systemctl status docker` is inactive
* Ensure that `systemctl --user status docker` is active
* To start docker in rootless mode run `systemctl --user start docker`

### Running the docker daemon as root
This is not recommended for security reasons. Altough it is still possbile by utilizing "devcontainer" files instead of the "rootless.devcontainer", substitute where applicable

### Setup: Instructional Video

We provide a mostly automated way of setting up the development environment for the Talawa API using Git, Docker, and Visual Studio Code. Follow the instructions below and refer to the provided instructional video for a visual guide.

Click on the image below to play the video.

[![Talawa API Environment Setup - Development](https://img.youtube.com/vi/jz7koJIXqtk/0.jpg)](https://www.youtube.com/watch?v=jz7koJIXqtk)

**Note: The video contains some inaccuracies.**

1.  Please ensure you clone from the correct repository [Talawa API Repository](https://github.com/PalisadoesFoundation/talawa-api)
2.  The correct branch to checkout is `develop`
3.  `postgres-test` is the name of the test database in the docker-compose file.

### Setup: Using the CLI

These steps are specific to Linux. You will need to modify them accordingly for other operating systems

1. Install `docker` and ensure that the daemon is running.
1. This process does not require the installation of PostgresSQL. If you have installed postgres on your system, make sure that it is not running.
1. Windows Only
   1. Make sure you clone the `talawa-api` repository to a `WSL` subdirectory.
   2. Run all the following commands from the repository root in that subdirectory.
1. Create the `.env` file by copying the template from the `envFiles/` directory.
   1. **DO NOT EDIT EITHER FILE!**
      ```bash
      cp envFiles/.env.rootless.devcontainer .env
1. You must ensure that docker is running for the Talawa-API application to work correctly. Follow these steps to verify its operation:
   1. Open a terminal window.
   2. Run the following commands to check if the required software is installed:
      ```
      docker --version
      docker-compose --version
      ```
   3. Run this command to check whether docker is running:
      ```
      docker info
      ```
   4. Using the Docker documentation, you must ensure that Docker will restart after your next reboot.

**Note:** Restart the docker if you are getting this error `Cannot connect to the Docker daemon `

## Configuring Talawa API

<<<<<<< HEAD
   ```
   {"outcome":"success","imageName":"talawa-api"}
   ```

1. Start the docker devcontainer

   ```
   devcontainer up --workspace-folder .
   ```

1. When the container installation is complete, the last lines of output should look like this:

   ```
   ...
   ...
   {"outcome":"success",   "containerId":"81306766f2aeeb851c8ebb844702d39ad2adc09419508b736ef2ee5a03eb8e34",   "composeProjectName":"talawa","remoteUser":"talawa","remoteWorkspaceFolder":"/home/talawa/api"}
   ```

All done!

#### CLI Startup (Development)

After a successful installation, use these commands to start the dev container.

Check if the container is running `docker ps`
If the container is already running:
1. To run in attached Mode
   ```
   docker exec talawa-api-1 /bin/bash -c 'pnpm run start_development_server'
   ```
2. To run in detached Mode
   ```
   docker exec talawa-api-1 /bin/bash -c 'nohup pnpm run start_development_server > /dev/null 2>&1 &'
   ```
If the container is not running:

1. To run in attached Mode
    ```
    docker compose --project-name talawa -f compose.yaml -f docker/compose.testing.yaml -f docker/compose.rootless.devcontainer.yaml up --build
    ```
2. To run in detached Mode
    ```
    docker compose --project-name talawa -f compose.yaml -f docker/compose.testing.yaml -f docker/compose.rootless.devcontainer.yaml up --build -d
    ```

#### CLI Shutdown (Development)

Use the command `docker compose` command to cleanly shut down the dev container

```
docker compose down
```


#### Importing Sample Data

Please refer to the section below.

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

## Sample Data

We have created sample data to make it easier for end users to get an understanding of the application.

### Importing Sample Data

This applies to users running Talawa API in dev containers.

1. Once the server is running, open a new terminal session.
2. Run the following command to import sample data into the database:
   ```bash
    docker exec talawa-api-1 /bin/bash -c 'pnpm run add:sample_data && exit'
   ```
   Refer to the next section for login information.

### Sample Data Users

Below is a table of user login credentials for the sample data.

| **Name**       | **Email Address**          | **Password** | **Role**      |
| -------------- | -------------------------- | ------------ | ------------- |
| Wilt Shepherd  | testsuperadmin@example.com | Pass@123     | administrator |
| Vyvyan Kerry   | testadmin1@example.com     | Pass@123     | administrator |
| Loyd Solomon   | testadmin2@example.com     | Pass@123     | administrator |
| Darcy Wilf     | testadmin3@example.com     | Pass@123     | administrator |
| Harve Lance    | testuser1@example.com      | Pass@123     | regular       |
| Praise Norris  | testuser2@example.com      | Pass@123     | regular       |
| Scott Tony     | testuser3@example.com      | Pass@123     | regular       |
| Teresa Bradley | testuser4@example.com      | Pass@123     | regular       |
| Bruce Garza    | testuser5@example.com      | Pass@123     | regular       |
| Burton Sanders | testuser6@example.com      | Pass@123     | regular       |
| Jeramy Garcia  | testuser7@example.com      | Pass@123     | regular       |
| Deanne Marks   | testuser8@example.com      | Pass@123     | regular       |
| Romeo Holland  | testuser9@example.com      | Pass@123     | regular       |
| Carla Nguyen   | testuser10@example.com     | Pass@123     | regular       |
| Peggy Bowers   | testuser11@example.com     | Pass@123     | regular       |

## Testing and Validation

Please refer to the [Testing and Validation Page](../developer-resources/testing/testing-validation.md) for more details.
- Please go to the [Configuration Guide](./configuration.md) to get Talawa-API configured.
