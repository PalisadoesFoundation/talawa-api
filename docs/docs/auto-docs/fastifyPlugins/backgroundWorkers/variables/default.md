[**talawa-api**](../../../README.md)

***

# Variable: default()

> **default**: (`fastify`) => `Promise`\<`void`\>

Defined in: src/fastifyPlugins/backgroundWorkers.ts:53

Background worker plugin for event materialization.

This plugin:
- Initializes the background worker service
- Starts the materialization and cleanup workers
- Starts metrics aggregation worker if enabled (requires performance plugin)
- Handles graceful shutdown of workers
- Provides worker status endpoints

**Dependencies:** The performance plugin must be registered before this plugin.
This is enforced via the `dependencies` array in the plugin configuration.

## Parameters

### fastify

`FastifyInstance`

## Returns

`Promise`\<`void`\>
