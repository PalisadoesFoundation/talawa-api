[**talawa-api**](../../../../README.md)

***

# Function: entityKey()

> **entityKey**(`entity`, `id`): `string`

Defined in: src/services/caching/cacheKeyGenerator.ts:35

Generate a cache key for a specific entity by ID.
Input values are sanitized to prevent key injection attacks.

## Parameters

### entity

`string`

The entity type (e.g., "user", "organization").

### id

The entity ID.

`string` | `number`

## Returns

`string`

Cache key in format: `talawa:v1:${entity}:${id}`.

## Example

```typescript
entityKey("user", "abc123") // "talawa:v1:user:abc123"
entityKey("user", "foo:bar") // "talawa:v1:user:foo_bar" (sanitized)
```
