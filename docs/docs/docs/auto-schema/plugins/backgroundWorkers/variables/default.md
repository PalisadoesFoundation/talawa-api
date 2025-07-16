[Admin Docs](/)

***

# Variable: default()

> **default**: (`fastify`) => `Promise`\<`void`\>

Defined in: [src/plugins/backgroundWorkers.ts:42](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/plugins/backgroundWorkers.ts#L42)

Background worker plugin for event materialization.

This plugin:
- Initializes the background worker service
- Starts the materialization and cleanup workers
- Handles graceful shutdown of workers
- Provides worker status endpoints

## Parameters

### fastify

`FastifyInstance`

## Returns

`Promise`\<`void`\>
