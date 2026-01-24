[**talawa-api**](../../../README.md)

***

# Function: default()

> **default**(`fastify`, `key`, `capacity`, `refillRate`, `cost`, `logger`): `Promise`\<`boolean`\>

Defined in: [src/utilities/leakyBucket.ts:15](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/leakyBucket.ts#L15)

Implements a leaky bucket rate limiter.

## Parameters

### fastify

`FastifyInstance`

The Fastify instance.

### key

`string`

The key to identify the bucket in Redis.

### capacity

`number`

The maximum capacity of the bucket.

### refillRate

`number`

The rate at which tokens are added to the bucket.

### cost

`number`

The cost in tokens for each request.

### logger

[`AppLogger`](../../logging/logger/type-aliases/AppLogger.md)

The logger instance.

## Returns

`Promise`\<`boolean`\>

- A promise that resolves to a boolean indicating if the request is allowed.
