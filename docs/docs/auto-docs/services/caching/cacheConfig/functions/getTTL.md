[API Docs](/)

***

# Function: getTTL()

> **getTTL**(`entity`): `number`

Defined in: [src/services/caching/cacheConfig.ts:73](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/cacheConfig.ts#L73)

Get the TTL for a specific entity type.
Respects environment variable overrides via CACHE_ENTITY_TTLS.

## Parameters

### entity

keyof [`EntityTTL`](../type-aliases/EntityTTL.md)

The entity type.

## Returns

`number`

TTL in seconds.
