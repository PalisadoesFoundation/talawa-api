[**talawa-api**](../../../README.md)

***

# Function: askForRedisUrl()

> **askForRedisUrl**(): `Promise`\<\{ `host`: `string`; `password`: `string`; `port`: `number`; \}\>

The function `askForRedisUrl` prompts the user to enter the Redis hostname, port, and password, and
returns an object with these values.

## Returns

`Promise`\<\{ `host`: `string`; `password`: `string`; `port`: `number`; \}\>

The function `askForRedisUrl` returns a promise that resolves to an object with the
properties `host`, `port`, and `password`.

## Defined in

[src/setup/redisConfiguration.ts:36](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/setup/redisConfiguration.ts#L36)
