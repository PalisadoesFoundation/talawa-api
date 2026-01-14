[API Docs](/)

***

# Variable: default()

> **default**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/backgroundWorkers.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/backgroundWorkers.ts#L42)

Background worker plugin for event materialization.

This plugin:
- Initializes the background worker service
- Starts the materialization and cleanup workers
- Starts metrics aggregation worker if enabled (requires performance plugin)
- Handles graceful shutdown of workers
- Provides worker status endpoints

## Parameters

### fastify

`FastifyInstance`

## Returns

`Promise`\<`void`\>

## Requires

performance - The performance plugin must be registered before this plugin
