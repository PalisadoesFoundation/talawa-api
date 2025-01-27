[**talawa-api**](../../../../README.md)

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

Promise<void>

## Defined in

[src/services/EventCache/cacheEvents.ts:10](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/services/EventCache/cacheEvents.ts#L10)
