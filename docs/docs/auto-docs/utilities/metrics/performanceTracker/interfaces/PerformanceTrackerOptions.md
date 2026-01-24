[**talawa-api**](../../../../README.md)

***

# Interface: PerformanceTrackerOptions

Defined in: [src/utilities/metrics/performanceTracker.ts:90](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L90)

Options for creating a performance tracker.

## Properties

### \_\_slowArray?

> `optional` **\_\_slowArray**: `object`[]

Defined in: [src/utilities/metrics/performanceTracker.ts:102](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L102)

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

Defined in: [src/utilities/metrics/performanceTracker.ts:96](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/performanceTracker.ts#L96)

Threshold in milliseconds for considering an operation as slow.
Operations exceeding this threshold will be added to the slow array.
Defaults to 200ms if not provided.
