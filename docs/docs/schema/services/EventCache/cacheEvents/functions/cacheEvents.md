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

[src/services/EventCache/cacheEvents.ts:10](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/services/EventCache/cacheEvents.ts#L10)
