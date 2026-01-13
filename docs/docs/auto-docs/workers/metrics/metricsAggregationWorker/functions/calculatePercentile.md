[API Docs](/)

***

# Function: calculatePercentile()

> **calculatePercentile**(`sortedValues`, `percentile`): `number`

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/metricsAggregationWorker.ts#L20)

Calculates a percentile value from a sorted array of numbers.
Uses linear interpolation between adjacent values for more accurate results.

## Parameters

### sortedValues

`number`[]

Array of numbers sorted in ascending order (must be non-empty)

### percentile

`number`

Percentile to calculate (0-100)

## Returns

`number`

The percentile value

## Throws

Error if sortedValues is empty
