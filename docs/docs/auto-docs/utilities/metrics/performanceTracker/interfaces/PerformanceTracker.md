[**talawa-api**](../../../../README.md)

***

# Interface: PerformanceTracker

Defined in: [src/utilities/metrics/performanceTracker.ts:34](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L34)

Performance tracker for monitoring request-level performance.

## Methods

### snapshot()

> **snapshot**(): [`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Defined in: [src/utilities/metrics/performanceTracker.ts:70](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L70)

Get a snapshot of current performance metrics.

#### Returns

[`PerfSnapshot`](../type-aliases/PerfSnapshot.md)

Performance snapshot

***

### start()

> **start**(`op`): () => `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:48](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L48)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:41](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L41)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:59](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L59)

Record a cache hit.

#### Returns

`void`

***

### trackCacheMiss()

> **trackCacheMiss**(): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:64](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L64)

Record a cache miss.

#### Returns

`void`

***

### trackDb()

> **trackDb**(`ms`): `void`

Defined in: [src/utilities/metrics/performanceTracker.ts:54](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/metrics/performanceTracker.ts#L54)

Record a database operation duration.

#### Parameters

##### ms

`number`

Duration in milliseconds

#### Returns

`void`
