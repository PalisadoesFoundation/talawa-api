[Admin Docs](/)

***

# Function: default()

> **default**(`fastify`, `key`, `capacity`, `refillRate`, `cost`): `Promise`\<`boolean`\>

Defined in: [src/utilities/leakyBucket.ts:13](https://github.com/PurnenduMIshra129th/talawa-api/blob/4d9be178e903c8bd2778a802379c92eee9a2afdf/src/utilities/leakyBucket.ts#L13)

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

## Returns

`Promise`\<`boolean`\>

A promise that resolves to a boolean indicating if the request is allowed.
