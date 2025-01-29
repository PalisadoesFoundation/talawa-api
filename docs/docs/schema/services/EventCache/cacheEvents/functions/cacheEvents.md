[Admin Docs](/)

***

# Function: cacheEvents()

> **cacheEvents**(`events`): `Promise`\<`void`\>

Stores events in Redis cache with a specified time-to-live (TTL).

## Parameters

### events

[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)[]

Array of events to be cached.

## Returns

`Promise`\<`void`\>

Promise`void`

## Defined in

[src/services/EventCache/cacheEvents.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/services/EventCache/cacheEvents.ts#L10)
