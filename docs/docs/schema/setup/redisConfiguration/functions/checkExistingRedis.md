[Admin Docs](/)

***

# Function: checkExistingRedis()

> **checkExistingRedis**(): `Promise`\<`string` \| `null`\>

The function `checkExistingRedis` checks if there is an existing Redis connection by iterating
through a list of Redis URLs and testing the connection.

## Returns

`Promise`\<`string` \| `null`\>

The function `checkExistingRedis` returns a Promise that resolves to a string or null.

## Defined in

[src/setup/redisConfiguration.ts:71](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/setup/redisConfiguration.ts#L71)
