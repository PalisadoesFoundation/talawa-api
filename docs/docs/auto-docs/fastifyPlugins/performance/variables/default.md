[**talawa-api**](../../../README.md)

***

# Variable: default()

> **default**: (`app`) => `Promise`\<`void`\>

Defined in: [src/fastifyPlugins/performance.ts:57](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/fastifyPlugins/performance.ts#L57)

Fastify plugin that adds performance tracking to all requests.
- Attaches a performance tracker to each request
- Adds Server-Timing headers to responses
- Provides /metrics/perf endpoint for recent performance snapshots (requires authentication)
- Exposes getMetricsSnapshots for background worker metrics aggregation

## Parameters

### app

`FastifyInstance`

## Returns

`Promise`\<`void`\>
