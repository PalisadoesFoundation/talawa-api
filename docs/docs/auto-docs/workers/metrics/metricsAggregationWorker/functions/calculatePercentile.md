[API Docs](/)

***

# Function: calculatePercentile()

> **calculatePercentile**(`sortedValues`, `percentile`): `number`

Defined in: [src/workers/metrics/metricsAggregationWorker.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/metrics/metricsAggregationWorker.ts#L16)

Calculates percentile value from a sorted array of numbers.

## Parameters

### sortedValues

`number`[]

Array of numbers sorted in ascending order

### percentile

`number`

Percentile to calculate (0-100)

## Returns

`number`

The percentile value
