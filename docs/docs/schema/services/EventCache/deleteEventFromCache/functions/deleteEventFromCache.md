[Admin Docs](/)

***

# Function: deleteEventFromCache()

> **deleteEventFromCache**(`eventId`): `Promise`\<`void`\>

Deletes the specified event from Redis cache.

## Parameters

### eventId

`ObjectId`

The ObjectId representing the event to delete from cache.

## Returns

`Promise`\<`void`\>

A promise resolving to void.

## Defined in

[src/services/EventCache/deleteEventFromCache.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/EventCache/deleteEventFromCache.ts#L10)
