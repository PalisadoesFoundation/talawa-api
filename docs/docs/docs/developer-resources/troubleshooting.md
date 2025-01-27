---
id: troubleshooting
title: Operation & Troubleshooting
slug: /developer-resources/troubleshooting
sidebar_position: 3
---

## Operation

This section covers how Talawa API operates

### Key Concepts

Before you begin, here are some important summaries of the technologies used.

#### Docker Development Containers (devcontainers)

Talawa API uses devcontainers for many features

Development containers, or devcontainers, are Docker containers that are specifically configured to provide a fully featured development environment. They can be used to run an application, to separate tools, libraries, or runtimes needed for working with a codebase, and to aid in continuous integration and testing. Dev containers can be run locally or remotely, in a private or public cloud, in a variety of supporting tools and editors.

The Development Container Specification seeks to find ways to enrich existing formats with common development specific settings, tools, and configuration while still providing a simplified, un-orchestrated single container option – so that they can be used as coding environments or for continuous integration and testing. Beyond the specification's core metadata, the spec also enables developers to quickly share and reuse container setup steps through Features and Templates.

- For more information visit [containers.dev](https://containers.dev/)

Regular Docker's core features are contrary to using it as a developer environment.

1. Each container has an isolated filesystem, so the container can't normally see code on the host system, and the host system can't see tools that are only installed in the container.
2. A container is based on an immutable image: you can't normally change the code a container is running without rebuilding the image and recreating the container. This is a familiar workflow for developers using compiled languages (C++, Java, Go, Rust), where even without Docker you still need to recompile and restart the application after every change.

Visit [this link](https://stackoverflow.com/questions/75652065/whats-the-difference-between-docker-compose-and-dev-containers) for further information on the differences between Containers and Dev Containers.

##### Talawa API Dev Containers

In Talawa API, the API devcontainer operates like a lightweight virtual machine which has network access available to the external containers services including:

1. `postgres`
1. `postgres-test`
1. `minio`
1. `minio-test`
1. `cloudbeaver`
1. `caddy`

The Talawa API git repository is mounted on it. After the Dev Container starts, the `node.js` development server runs on a port mapped to a port on your host system.

The API runs by default when the devcontainer starts, but only after the these compose services have already started.

**IMPORTANT NOTES**

1. Always keep your code up to date in your local branch because there may be changes not just to the code, but to the devcontainer configuration.
   1. Make sure your `.env` file is up to date with the latest changes in `.env.devcontainer` and restart the containers when there are changes.
   2. A `.env` file will be automatically created when the devcontainer starts, if doesn't previously exist.
   3. Preexisting `.env` files are not automatically updated with remote changes, you have to do that yourself.
2. Healthchecks are skipped in the devcontainer, because if the healthcheck for it was running then the api devcontainer would never start.

### Startup Sequence

## Troubleshooting
