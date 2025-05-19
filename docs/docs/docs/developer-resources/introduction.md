---
id: introduction
title: Introduction
slug: /developer-resources/introduction
sidebar_position: 1
---

Welcome to the Talawa-API developer resources.

## Design Philosophy

Coming Soon

### Authentication

We have kept the authentication system very minimal so that a proper authentication system can be put in place later on. We feel that some kind of typescript based authentication library that can integrate with the current database schema or a self hosted service with its own database is needed.

For this reason, the authentication system needs to be detached from the GraphQL schema and be handled using REST APIs using something like Better Auth: https://github.com/better-auth/better-auth 

## Important Directories

Review these important locations before you start your coding journey.

| **Directory**            | **Description**                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `devcontainer`           | Contains the devcontainer configuration file.                                                                                                                                                                                                                                                                                                           |
| `docker/`                | Contains Docker configuration files.                                                                                                                                                                                                                                                                                                                    |
| `drizzle_migrations/`    | Definitions that allow the the Drizzle ORM to modify the structure of a database schema by adding, removing, or changing columns in tables, essentially allowing you to update your database schema programmatically without writing raw SQL commands, ensuring that changes are tracked and can be applied consistently across different environments. |
| `envFiles/`              | Contains `.env` files for production, development and CI/CD pipelines                                                                                                                                                                                                                                                                                   |
| `src/drizzle`            | Contains drizzle-orm schema definitions for the postgres database.                                                                                                                                                                                                                                                                                      |
| `src/graphql`            | Used for storing all pothos schema definitions used for Talawa-API's graphql implementation.                                                                                                                                                                                                                                                            |
| `src/graphql/enums`      | Used for storing the schema definitions for the graphql inputs used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                         |
| `src/graphql/inputs`     | Used for storing the schema definitions for the graphql inputs used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                         |
| `src/graphql/interfaces` | Used for storing the schema definitions for the graphql interfaces used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                     |
| `src/graphql/scalars`    | Used for storing the schema definitions for the graphql scalars used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                        |
| `src/graphql/types`      | Used for storing the schema definitions for the graphql types used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                          |
| `src/graphql/unions`     | Used for storing the schema definitions for the graphql unions used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                         |
| `src/plugins`            | Contains the fastify plugins used to extend the base functionality of the fastify instance either for usage in other plugins or for usage in the route plugins.                                                                                                                                                                                         |
| `src/routes`             | Used for storing the schema definitions for the graphql enums used in the Talawa-API's graphql implementation.                                                                                                                                                                                                                                          |
| `test`                   | Contains the code for performing api tests against Talawa-API. The tests in this directory must follow the practices of black box testing and most of them should be written to be able to run concurrently.                                                                                                                                            |
| `test/routes/graphql`    | Contains the code for performing api tests against Talawa-API. The tests in this directory must follow the practices of black box testing and most of them should be written to be able to run concurrently.                                                                                                                                            |
