---
id: troubleshooting
title: Troubleshooting
slug: /developer-resources/troubleshooting
sidebar_position: 6
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
