---
id: operation
title: Operation
slug: /operation
sidebar_position: 4
---

## Introduction

The correct configuration steps to take depends on whether you are:

1. an end user installing our software (Production Environments) or,
2. one of our open source contributors (Development Environments).

Make sure you have installed and configured the application correctly beforehand.

1. [Installation Guide](./installation.md)
2. [Configuration Guide](./configuration.md)

Proceed to the relevant section below.

## Production Environment Operation

Operation of the production environment is easy.

### Production Server Startup

Start the server by running the following command:

```bash
docker compose up
```

### Production Server Shutdown

To stop the Docker Server, use this command:

```bash
docker compose down
```

## Development Environment Operation

We make heavy use of Docker containers in our workflows. Since containers are a Linux-based technology, on non-Linux platforms they require Linux emulation through virtual machines, which can impact performance. So, you should be aware that there are performance penalties and certain limitations with running containers on platforms like MacOS and Windows.

Ensure you have a good understanding of these `talawa-api` technologies:

1. Operating Systems:
   1. Unix based operating systems like linux based distributions, MacOS
   2. Windows Subsystem for Linux.
2. Git
3. Github
4. Docker
5. Docker compose
6. Visual studio code with devcontainers
7. Typescript
8. Node.js

Here is some additional information that you'll need to know:

1. If you are running **Windows**, we `STRONGLY RECOMMEND` that you run all commands using Windows Subsystem for Linux.
1. It is very important that you go through the [Devcontainers Official Documentation](https://code.visualstudio.com/docs/devcontainers/containers) for working with devcontainers in VScode.

Please proceed to the next sub-section.

### DevContainer Setup

You will first need to ensure that the DevContainer is setup correctly.

#### Using the CLI

Most of these steps are specific to Linux. You will need to modify them accordingly for other operating systems

1.  Ensure you have correctly configured your `.env` configuration file. Use the [Configuration Guide](./configuration.md) for assistance.
2.  Install the `devcontainers/cli` package
    ```
    pnpm install -g @devcontainers/cli
    ```
3.  You will now need to make your user a part of the `docker` operating system group or else you will get `permission denied` messages when starting docker later. `$USER` is a universal representation of your username. You don't need to change this in the command below.
    ```
    sudo usermod -a -G docker $USER
    ```
4.  You will only become a part of the `docker` group on your next login. You don't have to logout, just start another session on the CLI using the `su` command.

    ```
    sudo su $USER -
    ```

5.  Build the docker devcontainer

    ```
    devcontainer build --workspace-folder .
    ```

6.  When the build is complete, the last line of the output should be:

    ```
    {"outcome":"success","imageName":"talawa-api"}
    ```

7.  Start the docker devcontainer

    ```
    devcontainer up --workspace-folder .
    ```

8.  When the container startup is complete, the last lines of output should look like this:

    ```
    ...
    ...
    {"outcome":"success",   "containerId":"81306766f2aeeb851c8ebb844702d39ad2adc09419508b736ef2ee5a03eb8e34",   "composeProjectName":"talawa","remoteUser":"talawa","remoteWorkspaceFolder":"/home/talawa/api"}
    ```

All done!

#### Using the VScode IDE

You can setup the app using the VScode IDE. Here are the steps to follow:

1. Open cloned talawa-api project in Visual Studio Code.
1. Install the `devcontainer` extension in VScode.
1. You should see a notification that a `devcontainer` configuration file is available. Click on the notification and select `Reopen in Container`.
   - If you don't see the notification, you can open the command palette by pressing `Ctrl+Shift+P` and search for `Reopen in Container`.
   - Make sure you have downloaded `devcontainer` extension of vs code.
1. This will open a new Visual Studio Code window with the project running inside a Docker container. This will take a few minutes to complete.
1. Wait till the process is complete and you see ports being forwarded in the terminal.
1. You can check logs by clicking `Connecting to Dev Container (show log)`;
1. Create a new terminal in Visual Studio Code by pressing ``Ctrl+Shift+` ``.
1. Run the `pwd` command to confirm you are in the `/home/talawa/api` directory.
1. Run the following command to check if the project has required dependencies installed correctly:
   ```bash
      node -v
      pnpm -v
   ```

All done!

### Development Server Startup

The Development Server startup methodology depends on your environment.

#### From the CLI

After a successful installation of the DevContainer environment, use these commands to start the application's Docker container.

1. To run in attached Mode

   ```
   docker exec talawa-api-1 /bin/bash -c 'pnpm run start_development_server'
   ```

2. To run in detached Mode

   ```
   docker exec talawa-api-1 /bin/bash -c 'nohup pnpm run start_development_server > /dev/null 2>&1 &'
   ```

#### Within VScode

You can run the app after closing the terminal or restating the vscode using these commands:

1. for normal mode

   ```bash
      pnpm run start_development_server
   ```

1. for debugging mode

   ```bash
      pnpm run start_development_server_with_debugger
   ```

**Note:** These commands will start the server in development mode.

### Development Server Shutdown

Use the command `docker compose` command to cleanly shut down the dev container

```
docker compose down
```

### Importing Sample Data

This applies to users running Talawa API in dev containers.

1. Once the server is running, open a new terminal session.
2. Run the following command to import sample data into the database:
   ```bash
    docker exec talawa-api-1 /bin/bash -c 'pnpm run add:sample_data && exit'
   ```
   Sample data includes users, organizations, events, recurrence rules, recurring event instances, and other collections (see `scripts/dbManagement/sample_data/SAMPLE_DATA.md`).

Refer to the next section for login information.

#### Sample Data Users

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

### Testing and Validation

Please refer to the [Testing and Validation Page](../developer-resources/testing/testing-validation.md) for more details.
