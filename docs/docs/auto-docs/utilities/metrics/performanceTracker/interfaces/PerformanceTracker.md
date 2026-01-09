[API Docs](/)

***

# Interface: PerformanceTracker

Defined in: [src/utilities/metrics/performanceTracker.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L44)

Performance tracker for monitoring request-level performance.

## Methods

### snapshot()

> **snapshot**(): [`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Defined in: [src/utilities/metrics/performanceTracker.ts:86](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L86)

Get a snapshot of current performance metrics.

#### Returns

[`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Performance snapshot

***

### start()

> **start**(`op`): () => `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L58)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L51)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:69](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L69)

Record a cache hit.

#### Returns

`void`

***

### trackCacheMiss()

> **trackCacheMiss**(): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:74](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L74)

Record a cache miss.

#### Returns

`void`

***

### trackComplexity()

> **trackComplexity**(`score`): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:80](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L80)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:64](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L64)

Record a database operation duration.

#### Parameters

##### ms

`number`

Duration in milliseconds

#### Returns

`void`
