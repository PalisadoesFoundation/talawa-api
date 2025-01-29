[Admin Docs](/)

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

[src/setup/redisConfiguration.ts:36](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/setup/redisConfiguration.ts#L36)
