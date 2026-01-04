[API Docs](/)

***

# Interface: PerformanceTrackerOptions

Defined in: [src/utilities/metrics/performanceTracker.ts:82](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L82)

Options for creating a performance tracker.

## Properties

### slowMs?

> `optional` **slowMs**: `number`

Defined in: [src/utilities/metrics/performanceTracker.ts:88](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/performanceTracker.ts#L88)

Threshold in milliseconds for considering an operation as slow.
Operations exceeding this threshold will be added to the slow array.
Defaults to 200ms if not provided.
