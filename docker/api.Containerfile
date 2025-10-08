# syntax=docker/dockerfile:1

ARG API_GID=1000
ARG API_UID=1000

# https://github.com/devcontainers/templates/tree/main/src/debian
# This build stage sets up and switches to the `talawa` non root user, sets up fnm 
FROM mcr.microsoft.com/devcontainers/base:bookworm AS devcontainer
# Used to configure the group id for the group assigned to the non-root "talawa" user within the image.
ARG API_GID
# Used to configure the user id for the non-root "talawa" user within the image.
ARG API_UID
# For the subsequent shell commands makes the shell exit immediately if any command exits with a non zero exit code, makes the shell consider the exit code of the first command amongst the commands connected using the pipe operator `|` that exits with a non zero exit code for it to exit immediately(by default the shell considers the exit code of the last command amongst the commands connected with a pipe operator `|` for it to determine whether the operation was successful), tells the shell that following strings passed to it are commands to be executed and not paths to script files. 
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# https://code.visualstudio.com/remote/advancedcontainers/add-nonroot-user#_creating-a-nonroot-user
# Renames the 'vscode' group to 'talawa'.
RUN groupmod -n talawa vscode \
# Renames `vscode` user to `talawa`, sets `/home/talawa` as the home directory for `talawa` user, copies and assigns contents of `/home/vscode` to `/home/talawa`.
&& usermod -d /home/talawa -l talawa -m vscode \
# Changes user id of `talawa` user to `${API_UID}` argument.
&& usermod -u ${API_UID} talawa \
# Changes group id of `talawa` group to `${API_GID}` argument.
&& groupmod -g ${API_GID} talawa \
# Assigns `sudo` without password privileges to `talawa` user.
&& echo talawa ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/talawa \
# Sets read, no write and no execute permissions for the user and the group on `/etc/sudoers.d/talawa` file and no read, no write and no execute permissions for the other.  
&& chmod u=r--,g=r--,o=--- /etc/sudoers.d/talawa \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/* \
# https://code.visualstudio.com/remote/advancedcontainers/persist-bash-history
&& mkdir /commandhistory \
&& touch /commandhistory/.bash_history \
&& chown -R talawa /commandhistory \
&& echo "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" >> /home/talawa/.bashrc
# Create a global profile script that both login and non-interactive shells load
RUN echo '#!/bin/sh' > /etc/profile.d/fnm.sh \
    && echo 'export PATH="/home/talawa/.local/share/fnm:$PATH"' >> /etc/profile.d/fnm.sh \
    && echo 'eval "$(fnm env --corepack-enabled --resolve-engines --use-on-cd --version-file-strategy=recursive)"' >> /etc/profile.d/fnm.sh \
    && chmod +x /etc/profile.d/fnm.sh
# Ensure non-interactive bash sessions load the script
ENV BASH_ENV=/etc/profile.d/fnm.sh
# Also, have the talawa login shell source it explicitly by appending to its .bashrc
RUN echo "source /etc/profile.d/fnm.sh" >> /home/talawa/.bashrc
USER talawa
# Installs fnm.
RUN curl -fsSL --proto '=https' --tlsv1.2 https://fnm.vercel.app/install | bash -s -- --skip-shell 
ENV PATH=/home/talawa/.local/share/fnm:${PATH}
WORKDIR /home/talawa/api
  
FROM node:23.7.0-bookworm-slim AS base
# Used to configure the group id for the group assigned to the non-root "talawa" user within the image.
ARG API_GID
# Used to configure the user id for the non-root "talawa" user within the image.
ARG API_UID
# For the subsequent shell commands makes the shell exit immediately if any command exits with a non zero exit code, makes the shell consider the exit code of the first command amongst the commands connected using the pipe operator `|` that exits with a non zero exit code for it to exit immediately(by default the shell considers the exit code of the last command amongst the commands connected with a pipe operator `|` for it to determine whether the operation was successful), tells the shell that following strings passed to it are commands to be executed and not paths to script files. 
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# Deletes the pre-included "node" user along with its home directory.
RUN userdel -r node \
# Adds the "talawa" group with id equal to the value of argument "${API_GID}".
&& groupadd -g ${API_GID} talawa \
# Adds the "talawa" user with id equal to the value of argument "${API_UID}", assigns it to "talawa" group, creates the home directory for "talawa" user, sets bash as the "talawa" user's login shell.
&& useradd -g talawa -l -m -s "$(which bash)" -u ${API_UID} talawa \
&& corepack enable
USER talawa
WORKDIR /home/talawa/api

FROM base AS non_production
COPY --chown=talawa:talawa ./pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm fetch --frozen-lockfile
COPY --chown=talawa:talawa ./ ./
RUN pnpm install --frozen-lockfile --offline

# This build stage is used to build the codebase used in production environment of talawa api. 
FROM base AS production_code
COPY --chown=talawa:talawa ./pnpm-lock.yaml ./pnpm-lock.yaml 
RUN pnpm fetch --frozen-lockfile
COPY --chown=talawa:talawa ./ ./
RUN pnpm install --frozen-lockfile --offline && pnpm build_production

# This build stage is used to download and install the dependencies used in production environment of talawa api.
FROM base AS production_dependencies
COPY --chown=talawa:talawa ./pnpm-lock.yaml ./pnpm-lock.yaml 
RUN pnpm fetch --frozen-lockfile --prod
COPY --chown=talawa:talawa ./package.json ./package.json
RUN pnpm install --frozen-lockfile --offline --prod

# This build stage is used to create the container image for production environment of talawa api.
FROM base AS production
COPY --from=production_code /home/talawa/api/docker/apiHealthcheck.js ./docker/apiHealthcheck.js
COPY --from=production_code /home/talawa/api/dist ./dist
COPY --from=production_code /home/talawa/api/drizzle_migrations ./drizzle_migrations
COPY --from=production_code /home/talawa/api/package.json ./package.json
COPY --from=production_dependencies /home/talawa/api/node_modules ./node_modules
CMD ["node", "./dist/index"]
