[API Docs](/)

***

# Interface: PerformanceTracker

Defined in: src/utilities/metrics/performanceTracker.ts:42

Performance tracker for monitoring request-level performance.

## Methods

### snapshot()

> **snapshot**(): [`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Defined in: src/utilities/metrics/performanceTracker.ts:84

Get a snapshot of current performance metrics.

#### Returns

[`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Performance snapshot

***

### start()

> **start**(`op`): () => `void`

Defined in: src/utilities/metrics/performanceTracker.ts:56

Start timing an operation manually. Returns a function to call when the operation completes.

#### Parameters

##### op

`string`

Name of the operation being timed

#### Returns

Function to call when the operation completes

> (): `void`

##### Returns

`void`

***

### time()

> **time**\<`T`\>(`op`, `fn`): `Promise`\<`T`\>

Defined in: src/utilities/metrics/performanceTracker.ts:49

Time an async operation and record its duration.

#### Type Parameters

##### T

`T`

#### Parameters

##### op

`string`

Name of the operation being timed

##### fn

() => `Promise`\<`T`\>

Async function to execute and measure

#### Returns

`Promise`\<`T`\>

The result of the async function

***

### trackCacheHit()

> **trackCacheHit**(): `void`

Defined in: src/utilities/metrics/performanceTracker.ts:67

Record a cache hit.

#### Returns

`void`

***

### trackCacheMiss()

> **trackCacheMiss**(): `void`

Defined in: src/utilities/metrics/performanceTracker.ts:72

Record a cache miss.

#### Returns

`void`

***

### trackComplexity()

> **trackComplexity**(`score`): `void`

Defined in: src/utilities/metrics/performanceTracker.ts:78

Record a GraphQL query complexity score.

#### Parameters

##### score

`number`

Complexity score for the query

#### Returns

`void`

***

### trackDb()

> **trackDb**(`ms`): `void`

Defined in: src/utilities/metrics/performanceTracker.ts:62

Record a database operation duration.

#### Parameters

##### ms

`number`

Duration in milliseconds

#### Returns

`void`
