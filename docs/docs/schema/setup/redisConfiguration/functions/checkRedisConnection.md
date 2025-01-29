[Admin Docs](/)

***

# Function: checkRedisConnection()

> **checkRedisConnection**(`url`): `Promise`\<`boolean`\>

The function `checkRedisConnection` checks if a connection to Redis can be established using the
provided URL.

## Parameters

### url

`string`

The `url` parameter is a string that represents the URL of the Redis server.
It is used to establish a connection to the Redis server.

## Returns

`Promise`\<`boolean`\>

a Promise that resolves to a boolean value.

## Defined in

[src/setup/redisConfiguration.ts:12](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/setup/redisConfiguration.ts#L12)
