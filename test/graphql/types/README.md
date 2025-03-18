# About this directory

This directory contains the code for performing api tests against talawa api's graphql implementation. The tests in this directory must follow the practices of black box testing and must be able to run concurrently.

# Directory structure

At the very least this directory must contain three directories named `Mutation`, `Query` and `Subscription` because these three refer to the only three possible entrypoints to a graphql schema and the operations that are possible to be executed against it. The `./client.ts` file exports the graphql client that is used for triggering graphql operations against the talawa api's graphql implementation.

There aren't any other strict directory structure requirements for the this directory.