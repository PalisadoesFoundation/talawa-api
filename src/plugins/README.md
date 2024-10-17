# About this directory

This directory contains the fastify plugins that are used to extend the base functionality of the fastify instance either for usage in other plugins or for usage in the route plugins.

The fastify plugins defined in this directory might not be reusable and flexible in usage unlike the plugins listed on the [fastify ecosystem page](https://fastify.dev/ecosystem/). This is because these plugins are meant to be used strictly in the context of talawa api and they don't serve any purpose outside the context of this project. So, they're might not be able to be reused. 

# Directory structure requirements

The fastify plugins defined in this directory are to be manually registered on the root fastify instance. As such, there are no strict structure requirements for this directory for things to function properly. The only requirement is that the plugin must conform to the [FastifyPluginAsync](https://github.com/fastify/fastify/blob/main/types/plugin.d.ts) type definition.

# Example fastify plugin definition

The following code snippet shows how to design the fastify plugins that are to exist in this directory:-

```typescript
// ~/src/plugins/checkIsEvenPlugin.ts
import type { FastifyPluginAsync } from "fastify";

export const checkIsEvenPlugin: FastifyPluginAsync = async (fastify, opts) => {
  fastify.decorate("checkIsEven", function (number: number) {
    return number % 2 === 0;
  });
};

declare module "fastify" {
  interface FastifyInstance {
    checkIsEven: (number: number) => boolean;
  }
}

export default checkIsEvenPlugin;
```
Notice the usage of `declare module "fastify"` syntax. It is used to extend/override the global type definition for the fastify instance to integrate the types for new namespaces that are registered on the fastify instance because of the plugin registration. Similar procedure would be followed for other things. More info can be found [here](https://fastify.dev/docs/latest/Reference/TypeScript/#plugins).

If a plugin is not being used, these typescript module declarations should be commented out so as to not have incorrect typings on the global type definition for the fastify instance.

# Registering the plugins

The following code snippet shows how to register the fastify plugins defined in this directory on the global fastify instance:-

```typescript
import checkIsEvenPlugin from "~/src/plugins/checkIsEvenPlugin";

fastify.register(checkIsEvenPlugin, {});
fastify.checkIsEven(23);
```
Notice the usage of empty object `{}` as the second argument to the `register` function. Fastify has an [architectural limitation](https://fastify.dev/docs/latest/Reference/TypeScript/#using-a-plugin) regarding typescript where it won't throw type errors if the plugin that is being registered requires some initial configuration but the second argument to the `register` function is not passed. The only way strict type-checking works is if the second argument is provided explicitly, so it is a good practice to provide that empty object argument explicitly.
