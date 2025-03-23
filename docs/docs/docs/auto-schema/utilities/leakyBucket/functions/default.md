[Admin Docs](/)

***

# Function: default()

> **default**(`fastify`, `key`, `capacity`, `refillRate`, `cost`): `Promise`\<`boolean`\>

Defined in: [src/utilities/leakyBucket.ts:13](https://github.com/NishantSinghhhhh/talawa-api/blob/92ff044a4e2bbc8719de2b33b4f8d7d0a9aa0174/src/utilities/leakyBucket.ts#L13)

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
