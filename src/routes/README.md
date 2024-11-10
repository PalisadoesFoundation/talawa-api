# About this directory

This directory contains the encapsulated fastify route plugin functions that are used to define the route definitions for talawa api.

# Directory structure requirements

An `index.ts` file must be present in this directory exporting a fastify plugin function as a default export that has all other fastify route plugin functions in the directory registered within it.

Other than that there aren't any strict directory structure requirements.

# Example

In the example below we have fastify route plugin function named `helloRoute` at the path `/src/routes/hello.ts` and a default exported fastify plugin function named `routes` at the path `/src/routes/index.ts` which registers the `helloRoute` fastify route plugin within it.

```typescript
// `/src/routes/hello.ts`
import type { FastifyPluginAsync } from "fastify";

export const helloRoute: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get("/", async (request, reply) => {
    reply.status(200).send({ message: "world" });
  });
};

export default helloRoute;

////////////////////////////////////////////////////////////////////////////////

// `/src/routes/index.ts`
import type { FastifyPluginAsync } from "fastify";
import { helloRoute } from "./hello";

export const routes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.register(helloRoute, {});
};

export default routes;
```