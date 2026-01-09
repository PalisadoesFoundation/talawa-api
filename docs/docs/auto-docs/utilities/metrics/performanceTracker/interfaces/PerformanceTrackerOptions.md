[API Docs](/)

***

# Interface: PerformanceTrackerOptions

Defined in: [src/utilities/metrics/performanceTracker.ts:92](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L92)

Options for creating a performance tracker.

## Properties

### \_\_slowArray?

> `optional` **\_\_slowArray**: `object`[]

Defined in: [src/utilities/metrics/performanceTracker.ts:104](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L104)

**`Internal`**

Optional custom slow array for testing purposes.
If provided, this array will be used instead of creating a new one.
 - For testing only

#### ms

> **ms**: `number`

#### op

> **op**: `string`

***

### slowMs?

> `optional` **slowMs**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:98](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L98)

Threshold in milliseconds for considering an operation as slow.
Operations exceeding this threshold will be added to the slow array.
Defaults to 200ms if not provided.
