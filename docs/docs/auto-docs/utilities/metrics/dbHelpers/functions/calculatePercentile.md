[API Docs](/)

***

# Function: calculatePercentile()

> **calculatePercentile**(`values`, `percentile`): `number`

Defined in: src/utilities/metrics/dbHelpers.ts:116

Calculates a percentile value from an array of numbers.
Uses linear interpolation for values between data points.

## Parameters

### values

`number`[]

Array of numeric values

### percentile

`number`

Percentile to calculate (0-100)

## Returns

`number`

The percentile value

## Throws

If values array is null, undefined, or empty

## Throws

If percentile is not between 0 and 100

## Example

```typescript
const p95 = calculatePercentile([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 95);
// Returns: 95.5 (linear interpolation between 90 and 100)

const p50 = calculatePercentile([10, 20, 30, 40, 50], 50);
// Returns: 30 (median)
```
