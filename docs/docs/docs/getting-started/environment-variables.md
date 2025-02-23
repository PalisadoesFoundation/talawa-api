---
id: environment-variables
title: Environment Variables
slug: /installation/environment-variables
sidebar_position: 2
---

Talawa api primarily makes use of environment variables to configure the application behavior for different scenarios and use cases. By default most workflows are configured to parse and read environment variables defined in the `.env` file located at the root directory of this project.

Listed below are all the environment variables utilized by different workflows within talawa api.

> Environment variables should be explicitly provided to the container that they're being used for. This is because with changes in implicit environment variables docker cannot know exactly which compose container services should be rebuilt to reflect those changes. There are two ways of doing that, the first way is explicitly typing out each of those environment variables in the `environment` field of the compose container service and the second way is to create separate environment variable files for storing environment variables for each compose container service.

## Our `NODE_ENV` Variable Philosophy

The `NODE_ENV` variable is extremely sparsely used.

1. It should not be touched. It exists only to make other javascript tools **always** run with their production environment capabilities no matter the environment.
2. If a capability is to be controlled it must be done explicitly using an environment variable specific to that capability. For example the `API_IS_GRAPHIQL` and `API_IS_PINO_PRETTY` variables below are meant for enabling/disabling the `graphiql` web explorer and pretty logging by pino logger. We didn't use `NODE_ENV` for these because these functionalities should be individually configurable in all environments and not be controlled using a single `NODE_ENV` environment variable.

In an environment where one capability is needed but the other is not, using a single environment variable to control all of them at once wouldn't work.

## talawa api (standalone)

At runtime, talawa api requires certain environment variables to be defined in its execution context. Some of these environment variables must be provided by you and some are optional to be provided because they might be using a default value or their requirement is dependent on the environment in which talawa api is running.

### API_ADMINISTRATOR_USER_EMAIL_ADDRESS

This environment variable is used to configure the email address for the administrator user that talawa api will make sure exists in the database at the time of server startup.

### API_ADMINISTRATOR_USER_NAME

This environment variable is used to configure the name for the administrator user that talawa-api will make sure exists in the database at the time of server startup.

### API_ADMINISTRATOR_USER_PASSWORD

This environment variable is used to configure the password for the administrator user that talawa api will make sure exists in the database at the time of server startup.

### API_BASE_URL

This environment variable is used to configure the base url of the talawa api at runtime that clients making requests to the talawa api will make use of.

### API_COMMUNITY_FACEBOOK_URL

This environment variable is used to configure the url to the [facebook](https://facebook.com) account of the community.

### API_COMMUNITY_GITHUB_URL

This environment variable is used to configure the url to the [github](https://github.com) account of the community.

### API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION

This environment variable is used to configure the duration in seconds it should take for inactive clients to get timed out of their authenticated session within client-side talawa applications.

### API_COMMUNITY_INSTAGRAM_URL

This environment variable is used to configure the url to the [instagram](https://instagram.com) account of the community.

### API_COMMUNITY_LINKEDIN_URL

This environment variable is used to configure the url to the [linkedin](https://linkedin.com) account of the community.

### API_COMMUNITY_NAME

This environment variable is used to configure the name of the community.

### API_COMMUNITY_REDDIT_URL

This environment variable is used to configure the url to the [reddit](https://reddit.com) account of the community.

### API_COMMUNITY_SLACK_URL

This environment variable is used to configure the url to the [slack](https://slack.com) account of the community.

### API_COMMUNITY_WEBSITE_URL

This environment variable is used to configure the url to the website of the community.

### API_COMMUNITY_X_URL

This environment variable is used to configure the url to the [x](https://x.com) account of the community.

### API_COMMUNITY_YOUTUBE_URL

This environment variable is used to configure the url to the [youtube](https://youtube.com) account of the community.

### API_DEBUGGER_HOST

This environment variable is used to configure the host ip that can access the host port on which talawa api debugger listens to at runtime.

- More information can be found at [this](https://developer.mozilla.org/en-US/docs/Web/API/URL/host) link.

### API_DEBUGGER_PORT

This environment variable is used to configure the host port on which talawa api debugger listens to at runtime.

When talawa api debugger is run within a container environment this variable must be assigned a value of `0.0.0.0` for the host system to have access to the port talawa api debugger listens on within the container at runtime.

- More information can be found at [this](https://developer.mozilla.org/en-US/docs/Web/API/URL/port) link.

### API_HOST

This environment variable is used to configure the host ip that can access the host port on which talawa api listens to at runtime.

When talawa api is run within a container environment this variable must be assigned a value of `0.0.0.0` for the host system to have access to the port talawa api listens on within the container at runtime.

- More information can be found at [this](https://developer.mozilla.org/en-US/docs/Web/API/URL/host) link.

### API_IS_APPLY_DRIZZLE_MIGRATIONS

This environment variable is used to enable or disable the behavior of applying the drizzle orm sql migrations to the postgresql database at the time of initialization of talawa api.

### API_IS_GRAPHIQL

This environment variable is used to enable or disable serving the graphiql web client from the talawa api server.

### API_IS_PINO_PRETTY

This environment variable is used to enable or disable pretty logging for the talawa api server.

More information can be found at these links:

1. https://fastify.dev/docs/latest/Reference/Logging/
2. https://github.com/pinojs/pino-pretty

### API_JWT_EXPIRES_IN

This environment variable is used to configure the time in milli-seconds it takes for an authentication json web token issued by talawa api to expire.

### API_JWT_SECRET

This environment variable is used to configure the secret used for signing and verifying the authentication json web tokens issued by talawa api. This secret must be at least 64 characters in length.

- More information can be found at [this](https://github.com/fastify/fastify-jwt?tab=readme-ov-file##secret-required) link.

### API_LOG_LEVEL

This environment variable is used to configure the [log level](https://github.com/pinojs/pino/blob/main/docs/api.md##logger-level) for talawa api's [pino.js](https://github.com/pinojs/pino) logger. Possible values are `debug`, `error`, `fatal`, `info`, `trace` and `warn`.

- More information can be found at [this](https://github.com/pinojs/pino/blob/main/docs/api.md##logger-level) link.

### API_MINIO_ACCESS_KEY

This environment variable is used to configure the access key to the minio server for talawa api's minio client to connect with.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_MINIO_END_POINT

This environment variable is used to configure the host ip of the minio server for talawa api's minio client to connect with.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_MINIO_PORT

This environment variable is used to configure the host port of the minio server for talawa api's minio client to connect with.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_MINIO_SECRET_KEY

This environment variable is used to configure the secret key to the minio server for talawa api's minio client to connect with.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_MINIO_USE_SSL

This environment variable is used to configure the ssl mode on the connection between minio server and talawa api's minio client.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_PORT

This environment variable is used to configure the host port on which talawa api listens to at runtime.

- More information can be found at [this](https://developer.mozilla.org/en-US/docs/Web/API/URL/port) link.

### API_POSTGRES_DATABASE

This environment variable is used to configure the name of the postgres database for talawa api's postgres client to connect with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_POSTGRES_HOST

This environment variable is used to configure the host ip of the postgres server for talawa api's postgres client to connect with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_POSTGRES_PASSWORD

This environment variable is used to configure the password of the postgres user on the postgres server for talawa api's postgres client to authenticate with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_POSTGRES_PORT

This environment variable is used to configure the host port of the postgres server for talawa api's postgres client to connect with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_POSTGRES_SSL_MODE

This environment variable is used to configure the ssl/tls mode of the connection between the postgres server and talawa api's postgres client.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_POSTGRES_USER

This environment variable is used to configure the name of the postgres user on the postgres server for talawa api's postgres client to authenticate with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### API_MINIO_TEST_END_POINT

This environment variable is used to configure the host ip of the minio test server for talawa api's minio client to connect with.

- More information can be found at [this](https://min.io/docs/minio/linux/developers/javascript/API.html##constructor) link.

### API_POSTGRES_TEST_HOST

This environment variable is used to configure the host ip of the postgres server for talawa api's postgres client to connect with.

- More information can be found at [this](https://github.com/porsager/postgres?tab=readme-ov-file##environmental-variables) link.

### CI

This environment variable is used to enable or disable certain features in vitest that are supposed to only run in continous integration environments.

### NODE_ENV

This is a legacy environment variable used to configure the environment in which node.js is supposed to run in but its use is no longer recommended. It is kept with a default value of `production` for backwards compatibility.

- More information can be found at [this](https://blog.platformatic.dev/handling-environment-variables-in-nodejs##heading-set-nodeenvproduction-for-all-environments) link.

## api (Container)

Talawa api's node.js server is configured to be started as a container service named `api`. Listed below are the environment variables accepted by this container service.

### API_DEBUGGER_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which talawa api debugger listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### API_DEBUGGER_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which talawa api debugger listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### API_GID

This environment variable is used to configure the value of group id of the group assigned to the default non-root `talawa` user within the talawa api container.

- More information can be found at [this](https://www.docker.com/blog/understanding-the-docker-user-instruction/) link.

### API_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which talawa api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### API_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which talawa api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### API_UID

This environment variable is used to configure the value of user id of the default non-root user `talawa` within the talawa api container.

- More information can be found at [this](https://www.docker.com/blog/understanding-the-docker-user-instruction/) link.

## caddy (Container)

### CADDY_HTTP_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which caddy listens to at runtime for http requests.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CADDY_HTTPS_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which caddy listens to at runtime for https requests.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CADDY_HTTP3_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which caddy listens to at runtime for http/3 requests.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CADDY_TALAWA_API_DOMAIN_NAME

This environment variable is used to configure the domain name provided by a dns provider that is assigned to the public ip address of the machine on which talawa api runs.

- More information can be found at [this](https://caddyserver.com/docs/caddyfile/options##email) link.

### CADDY_TALAWA_API_EMAIL

This environment variable is used to configure the email to which the certificate authority issuing digital certificates for talawa api's secure connection at runtime can send email to.

- More information can be found at [this](https://caddyserver.com/docs/caddyfile/options##email) link.

### CADDY_TALAWA_API_HOST

This environment variable is used to configure the host that can access the port on which talawa api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CADDY_TALAWA_API_PORT

This environment variable is used to configure the port on which talawa api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

## cloudbeaver (Container)

Listed below is a subset of environment variables that are accepted by the `cloudbeaver` container service.

More information could be found at [this](https://github.com/dbeaver/cloudbeaver/wiki/Server-configuration##automatic-server-configuration) link.

### CLOUDBEAVER_ADMIN_NAME

This environment variable is used to configure name for the default cloudbeaver admin account.

- More information can be found at [this](https://github.com/dbeaver/cloudbeaver/wiki/Server-configuration##automatic-server-configuration) link.

### CLOUDBEAVER_ADMIN_PASSWORD

This environment variable is used to configure password for the default cloudbeaver admin account created using the `${CLOUDBEAVER_ADMIN_NAME}` environment variable.

- More information can be found at [this](https://github.com/dbeaver/cloudbeaver/wiki/Server-configuration##automatic-server-configuration) link.

### CLOUDBEAVER_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which cloudbeaver listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CLOUDBEAVER_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which cloudbeaver listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### CLOUDBEAVER_SERVER_NAME

This environment variable is used to configure name for the default talawa cloudbeaver server the cloudbeaver client connects to at runtime.

- More information can be found at [this](https://github.com/dbeaver/cloudbeaver/wiki/Server-configuration##automatic-server-configuration) link.

### CLOUDBEAVER_SERVER_URL

This environment variable is used to configure url for the default talawa cloudbeaver server the cloudbeaver client connects to at runtime.

- More information can be found at [this](https://github.com/dbeaver/cloudbeaver/wiki/Server-configuration##automatic-server-configuration) link.

## minio (Container)

Listed below is a subset of environment variables that are accepted by the `minio` container service.

More information could be found at [this](https://min.io/docs/minio/linux/reference/minio-server/minio-server.html##id4) link.

### MINIO_BROWSER

This environment variable is used to configure the toggle state of minio console between `on` and `off`.

- More information can be found at [this](https://min.io/docs/minio/linux/reference/minio-server/settings/console.html##envvar.MINIO_BROWSER) link.

### MINIO_API_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which minio api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### MINIO_API_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which minio api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### MINIO_CONSOLE_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which minio console listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### MINIO_CONSOLE_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which minio console listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### MINIO_ROOT_PASSWORD

This environment variable is used to configure password for the default minio root user `minioadmin` or the custom minio root user created using the `${MINIO_ROOT_USER}` environment variable.

- More information can be found at [this](https://min.io/docs/minio/linux/reference/minio-server/settings/root-credentials.html##envvar.MINIO_ROOT_PASSWORD) link.

### MINIO_ROOT_USER

This environment variable is used to configure name for a custom minio root user.

- More information can be found at [this](https://min.io/docs/minio/linux/reference/minio-server/settings/root-credentials.html##root-user) link.

## minio-test (Container)

Listed below is a subset of environment variables that are accepted by the `minio-test` container service.

More information could be found at [this](https://min.io/docs/minio/linux/reference/minio-server/minio-server.html##id4) link.

### MINIO_TEST_API_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which minio test api listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### MINIO_TEST_CONSOLE_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which minio test console listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

## postgres (Container)

Listed below is a subset of environment variables that are accepted by the `postgres` container service.

More information could be found at [this](https://github.com/docker-library/docs/blob/master/postgres/README.md##environment-variables) link.

### POSTGRES_DB

This environment variable is used to configure name for the database that will be created within the postgres container on startup if not already present.

- More information can be found at [this](https://github.com/docker-library/docs/tree/master/postgres##postgres_db) link.

### POSTGRES_MAPPED_HOST_IP

This environment variable is used to configure the host ip that can access the host port mapped with the container service port on which postgres listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### POSTGRES_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which postgres listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

### POSTGRES_PASSWORD

This environment variable is used to configure password for the default `postgres` postgres user or the custom postgres user created using the `${POSTGRES_USER}` environment variable.

- More information can be found at [this](https://github.com/docker-library/docs/tree/master/postgres##postgres_password) link.

### POSTGRES_USER

This environment variable is used to configure name for a custom postgres user with superuser permissions.

- More information can be found at [this](https://github.com/docker-library/docs/tree/master/postgres##postgres_user) link.

## postgres-test (Container)

Listed below is a subset of environment variables that are accepted by the `postgres-test` container service.

More information could be found at [this](https://github.com/docker-library/docs/blob/master/postgres/README.md##environment-variables) link.

### POSTGRES_TEST_MAPPED_PORT

This environment variable is used to configure the host port to map with the container service port on which postgres test listens to at runtime.

- More information can be found at [this](https://docs.docker.com/engine/network/##published-ports) link.

## docker compose

### COMPOSE_FILE

This environment variable is used to configure what docker compose configuration files are to be evaluated by docker and docker compose.

- More information can be found at [this](https://docs.docker.com/compose/how-tos/environment-variables/envvars/##compose_file) link.

### COMPOSE_PROFILES

This environment variable is used to enable or disable container services to be run by docker compose. Possible values are `api`, `caddy`, `cloudbeaver`, `minio`, `minio_test`, `postgres` and `postgres-test`.

- More information can be found at [this](https://docs.docker.com/compose/environment-variables/envvars/##compose_profiles) link.

### COMPOSE_PROJECT_NAME

This environment variable is used to configure the prefix for identifiers of all the container services to be run by docker compose.

- More information can be found at [this](https://docs.docker.com/compose/environment-variables/envvars/##compose_project_name) link.
