[API Docs](/)

***

# Interface: PerformanceTracker

Defined in: [src/utilities/metrics/performanceTracker.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L40)

Performance tracker for monitoring request-level performance.

## Methods

### snapshot()

> **snapshot**(): [`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Defined in: [src/utilities/metrics/performanceTracker.ts:76](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L76)

Get a snapshot of current performance metrics.

#### Returns

[`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Performance snapshot

***

### start()

> **start**(`op`): () => `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:54](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L54)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L47)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:65](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L65)

Record a cache hit.

#### Returns

`void`

***

### trackCacheMiss()

> **trackCacheMiss**(): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L70)

Record a cache miss.

#### Returns

`void`

***

### trackDb()

> **trackDb**(`ms`): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:60](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L60)

Record a database operation duration.

#### Parameters

##### ms

`number`

Duration in milliseconds

#### Returns

`void`
