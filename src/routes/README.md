# About this folder

This folder contains all the routes that ought to be available on the talawa-api server at runtime. Since everything in fastify is a plugin, therefore, each route exported from within this folder is also a fastify plugin. More info on fastify plugins:-

1. [Guides/The hitchhiker's guide to plugins](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
2. [Reference/Fastify plugins](https://fastify.dev/docs/latest/Reference/Plugins/)

> **_NOTE:_** The route plugins defined and exported within this folder will automatically be imported and resolved using [fastify-autoload](https://github.com/fastify/fastify-autoload) package in the future.

# Directory structure conventions

TODO
