[API Docs](/)

***

# Variable: default()

> **default**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/backgroundWorkers.ts:39](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/backgroundWorkers.ts#L39)

Background worker plugin for event materialization.

This plugin:
- Initializes the background worker service
- Starts the materialization and cleanup workers
- Starts metrics aggregation worker if enabled and performance plugin is available
- Handles graceful shutdown of workers
- Provides worker status endpoints

## Parameters

### fastify

`FastifyInstance`

## Returns

`Promise`\<`void`\>
