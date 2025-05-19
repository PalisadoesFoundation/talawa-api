---
id: pnpm-scripts
title: PNPM Scripts
slug: /developer-resources/pnpm-scripts
sidebar_position: 2
---

The scripts listed below are used with pnpm for many different workflows of talawa api.

## pnpm apply_drizzle_migrations

This command is used to apply the sql migration files present in the `drizzle_migrations` directory to the postgres database being used by talawa api.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm apply_drizzle_test_migrations

This command is used to apply the sql migration files present in the `drizzle_migrations` directory to the postgres test database being used by talawa api.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm build_production

This command is used to create a production build of the talawa api codebase by transpiling the typescript code to javascript code and also getting rid of unnecessary stuff not needed in production.

- More information can be found at [this](https://swc.rs/docs/usage/cli) link.

## pnpm check_code_quality

This command is used to check the linting and formatting issues in the codebase.

- More information can be found at [this](https://biomejs.dev/reference/cli/#biome-check) link.

## pnpm check_drizzle_migrations

This command is used to check for inconsistencies and collisions in the sql migration files in the `drizzle_migrations` directory that could arise because of many contributers contributing to the project.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm check_type_errors

This command is used to check the type errors in the codebase using typescript compiler.

- More information can be found at [this](https://www.typescriptlang.org/docs/handbook/compiler-options.html#using-the-cli) link.

## pnpm disable_git_hooks

This command is used to disable the git hooks that automate some repetitive workflows related to git.

More information can be found [this](https://evilmartians.github.io/lefthook/usage/commands.html?highlight=lefthook%20uninstall#lefthook-uninstall) link.

## pnpm drop_drizzle_migrations

This command is used to delete the existing sql migration files in the `drizzle_migrations` directory as their manual deletion would break drizzle-kit.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm enable_git_hooks

This command is used to enable the git hooks that automate some repetitive workflows related to git.

More information can be found [this](https://evilmartians.github.io/lefthook/usage/commands.html?highlight=lefthook%20install#lefthook-install) link.

## pnpm fix_code_quality

This command is used to fix as many linting and formatting issues in the codebase as possible for being auto-fixed. Output of this command resulting in a failure means that there are some issues that need to be fixed manually.

- More information can be found at [this](https://biomejs.dev/reference/cli/#biome-check) link.

## pnpm generate_drizzle_migrations

This command is used to generate the sql migration files in the `drizzle_migrations` directory that reflect the latest state of the drizzle schema in the codebase.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm generate_graphql_sdl_file

This command is used to generate the graphql schema definition language file for talawa api's graphql implementation at the root directory of this workspace in a file named `schema.graphql`.

## pnpm generate_gql_tada

This command is used to generate the files containing the typescript types corresponding to talawa api's graphql implementation and ahead of time graphql document type cache corresponding to the graphql operation documents used in integration tests for talawa api's graphql implementation. This is done by inferring them from the graphql sdl file present at the root directory of this workspace in the file name `schema.graphql` and the graphql operation documents present within the the directory named `test` at the root directory of this workspace.

More information can be found at these links:

1. https://gql-tada.0no.co/reference/config-format#tadaoutputlocation
2. https://gql-tada.0no.co/reference/config-format#tadaturbolocation

## pnpm push_drizzle_schema

This command is used to push the changes in the drizzle-orm schema in the codebase to the postgres database for rapid local development(prototyping) without having to handle generating and applying the drizzle migration files after each little change.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm push_drizzle_test_schema

This command is used to push the changes in the drizzle-orm schema in the codebase to the postgres test database for rapid local development(prototyping) without having to handle generating and applying the drizzle migration files after each little change.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.

## pnpm run_tests

This command is used to run the integration tests for talawa api.

- More information can be found at [this](https://vitest.dev/) link.

## pnpm start_development_server

This command is used to concurrently start the development server of talawa api in watch mode and the typescript compiler in watch mode to check for type errors.

## pnpm start_development_server_with_debugger

This command is used to start the development server of talawa api and a debugger attached to that process on host `127.0.0.1` and port `9229` by default that are customizable through the environment variables `$API_DEBUGGER_HOST` and `$API_DEBUGGER_PORT`.

More information at these links:

1. https://nodejs.org/en/learn/getting-started/debugging
2. https://nodejs.org/api/debugger.html

## pnpm start_production_server

This command is used to start the production server of talawa api.

## pnpm start_production_server_with_debugger

This command is used to start the production server of talawa api and a debugger attached to that process on host `127.0.0.1` and port `9229` by default that are customizable through the environment variables `$API_DEBUGGER_HOST` and `$API_DEBUGGER_PORT`.

More information at these links:

1. https://nodejs.org/en/learn/getting-started/debugging
2. https://nodejs.org/api/debugger.html

## pnpm upgrade_drizzle_metadata

This command is used to keep the drizzle metadata in the `drizzle_migrations/_meta` directory up to date with the latest changes in drizzle-orm and drizzle-kit.

- More information can be found at [this](https://orm.drizzle.team/docs/kit-overview) link.
