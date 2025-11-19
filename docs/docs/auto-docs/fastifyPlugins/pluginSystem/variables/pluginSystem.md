[API Docs](/)

***

# Variable: pluginSystem()

> `const` **pluginSystem**: (`fastify`) => `Promise`\<`void`\>

Defined in: src/fastifyPlugins/pluginSystem.ts:18

Integrates the plugin system into the Fastify application.
This plugin initializes the plugin manager and makes it available
throughout the application lifecycle.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>
