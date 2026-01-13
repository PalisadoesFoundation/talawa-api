[API Docs](/)

***

# Variable: default()

> **default**: (`app`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/performance.ts:149](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/fastifyPlugins/performance.ts#L149)

Fastify plugin that adds performance tracking to all requests.
- Attaches a performance tracker to each request
- Adds Server-Timing headers to responses
- Provides /metrics/perf endpoint for recent performance snapshots
- Exposes metrics aggregation interface for background workers

## Parameters

### app

`FastifyInstance`

## Returns

`Promise`\<`void`\>
