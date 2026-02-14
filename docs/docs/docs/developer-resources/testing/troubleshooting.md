---
id: troubleshooting
title: Troubleshooting
slug: /developer-resources/troubleshooting
sidebar_position: 1000
---

## Introduction

This page provides basic troubleshooting steps for the applications.

## Docker

When running the application using docker it may seem difficult at first to troubleshoot failures. This section covers some basic troubleshooting strategies.

### Status Validation

You can get a summary of all the running docker containers using the `docker ps` command.

It will provide this information under these headings:

1. **CONTAINER ID**: Container IDs
1. **IMAGE**: Image names on which the containers are based
1. **COMMAND**: The command that created the containers
1. **CREATED**: The time of containers
1. **STATUS**: Whether or not the containers are healthy
1. **PORTS**: The exposed ports they use
1. **NAMES**: The names of the running containers

Here is an example:

```
CONTAINER ID   IMAGE           COMMAND                CREATED        STATUS        PORTS                    NAMES
3a6743b03029   docker-app      "docker-entrypoint.s…" 42 minutes ago Up 41 minutes 0.0.0.0:4321->4321/tcp   docker-app-1
f86a9f480819   talawa-api-dev  "/bin/bash /init-dat…" 42 minutes ago Up 42 minutes 0.0.0.0:4000->4000/tcp   talawa-api-dev
83ae5ff56a3f   redis:8.0       "docker-entrypoint.s…" 42 minutes ago Up 42 minutes 0.0.0.0:6379->6379/tcp   talawa-api-redis
44c8a0f38b04   minio/minio     "/usr/bin/docker-ent…" 42 minutes ago Up 42 minutes 0.0.0.0:9000->9001/tcp   talawa-api-minio-1
3a9deccdb68e   caddy/caddy:2.9 "caddy run --config …" 42 minutes ago Up 42 minutes 0.0.0.0:9080->9080/tcp   caddy-service
132dacf0aff4   mongo           "/bin/bash /init-mon…" 42 minutes ago Up 42 minutes 0.0.0.0:27017->27017/tcp mongo
```

You can get information on each of the headings by using filters like this:

1. CONTAINER ID: `docker ps --format '{{.ID}}'`
1. IMAGE: `docker ps --format '{{.Names}}'`
1. COMMAND: `docker ps --format '{{.Command}}'`
1. CREATED: `docker ps --format '{{.RunningFor}}'`
1. STATUS: `docker ps --format '{{.Status}}'`
1. PORTS: `docker ps --format '{{.Ports}}'`
1. NAMES: `docker ps --format '{{.Names}}'`

### Checking Running Ports

To quickly check which application ports are running and which are not, you can use the provided port check script:

```bash
bash scripts/port-check/port.sh
```

### Accessing The Container CLI

You can access the CLI of each container using the docker interactive TTY mode flags `-it`.

Here is an example accessing the `/bin/bash` CLI of the `talawa-api-dev` container:

```bash
$ docker exec -it talawa-api-dev /bin/bash
root@f86a9f480819:/usr/src/app# ls
CODEOWNERS          Caddyfile         Dockerfile.prod
CODE_OF_CONDUCT.md  DOCUMENTATION.md  INSTALLATION.md
CONTRIBUTING.md     Dockerfile.dev    ISSUE_GUIDELINES.md
root@f86a9f480819:/usr/src/app# exit
$
```

Here is an example accessing the `/bin/mongosh` CLI of the `mongo` container:

```bash
$ docker exec -it mongo /bin/mongosh
...
...
...
rs0 [direct: primary] test> show databases
admin        80.00 KiB
config      356.00 KiB
local         1.92 MiB
talawa-api    2.49 MiB
rs0 [direct: primary] test> exit
$
```

### Viewing Container Logs

You can view the container logs in real time by using the `docker logs -f` command. The output will update dynamically as you run the app.

In this case we see the logs of the `mongo` container. The `-n 10` flag makes the output start with the most recent 10 rows of logs which makes the output less verbose.

```bash
$ docker logs -f mongo -n 10
```

```
mongosh","version":"6.12.0|2.3.8"},"platform":"Node.js v20.18.1, LE","os":{"name":"linux","architecture":"x64","version":"3.10.0-327.22.2.el7.x86_64","type":"Linux"},"env":{"container":{"runtime":"docker"}}}}}
{"t":{"$date":"2025-02-22T01:14:08.038+00:00"},"s":"I",  "c":"NETWORK",  "id":51800,   "ctx":"conn2194","msg":"client metadata","attr":{"remote":"127.0.0.1:36844","client":"conn2194","negotiatedCompressors":[],"doc":{"application":{"name":"mongosh 2.3.8"},"driver":{"name":"nodejs|mongosh","version":"6.12.0|2.3.8"},"platform":"Node.js v20.18.1, LE","os":{"name":"linux","architecture":"x64","version":"3.10.0-327.22.2.el7.x86_64","type":"Linux"},"env":{"container":{"runtime":"docker"}}}}}
{"t":{"$date":"2025-02-22T01:14:08.040+00:00"},"s":"I",  "c":"NETWORK",  "id":6788700, "ctx":"conn2193","msg":"Received first command on ingress connection since session start or auth handshake","attr":{"elapsedMillis":2}}
{"t":{"$date":"2025-02-22T01:14:08.040+00:00"},"s":"I",  "c":"NETWORK",  "id":22943,   "ctx":"listener","msg":"Connection accepted","attr":{"remote":"127.0.0.1:36848","uuid":{"uuid":{"$uuid":"1ef5fcbd-4913-45fe-bc66-7bc3600a941a"}},"connectionId":2195,"connectionCount":24}}
{"t":{"$date":"2025-02-22T01:14:08.043+00:00"},"s":"I",  "c":"NETWORK",  "id":22943,   "ctx":"listener","msg":"Connection accepted","attr":{"remote":"127.0.0.1:36854","uuid":{"uuid":{"$uuid":"48522796-7b00-46df-a5d1-3e2a9ec7edd8"}},"connectionId":2196,"connectionCount":25}}
```

## Docker Rootless Mode

This section covers troubleshooting specific to running the devcontainer in Docker Rootless mode.

### Permission Denied on Docker Socket

If the container cannot access the Docker socket, verify the following:

1. The socket exists at the expected path:
   ```bash
   ls -la ${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/docker.sock
   ```
2. Your user has read/write access to the socket file.
3. The `XDG_RUNTIME_DIR` environment variable is set correctly:
   ```bash
   echo $XDG_RUNTIME_DIR
   # Should output something like /run/user/1000
   ```

### Socket Not Found

If Docker reports that the socket cannot be found:

1. Check your `DOCKER_HOST` variable:
   ```bash
   echo $DOCKER_HOST
   # Should output something like unix:///run/user/1000/docker.sock
   ```
2. Ensure `XDG_RUNTIME_DIR` is set on your host machine **before** starting VS Code or the devcontainer CLI:
   ```bash
   export UID=$(id -u)
   export XDG_RUNTIME_DIR=/run/user/$UID
   ```
3. Verify the Docker daemon is running in rootless mode:
   ```bash
   docker info --format '{{.SecurityOptions}}'
   # Should include "rootless" in the output
   ```

### Bind Mount Permission Issues

In rootless Docker mode, the container runs as `root` internally, but this maps to your non-root host user due to user namespace remapping. If you encounter permission issues with bind-mounted directories:

1. Verify that the workspace directory is owned by your host user:
   ```bash
   ls -la /path/to/talawa-api
   ```
2. Ensure no files are owned by a different user or root.

### Container Fails to Start

If the rootless devcontainer fails to start:

1. Verify Docker rootless is installed and running:
   ```bash
   systemctl --user status docker
   ```
2. Check Docker rootless logs:
   ```bash
   journalctl --user -u docker
   ```
3. Ensure the environment variables are exported in the same shell session where you launch VS Code:
   ```bash
   export UID=$(id -u)
   export XDG_RUNTIME_DIR=/run/user/$UID
   export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
   code .
   ```
