[**talawa-api**](../../../../README.md)

***

# Function: calculateMedian()

> **calculateMedian**(`values`): `number`

Defined in: src/utilities/metrics/dbHelpers.ts:56

Calculates the median of an array of numbers.
For even-length arrays, returns the average of the two middle values.

## Parameters

### values

`number`[]

Array of numeric values

## Returns

`number`

The median value, or 0 if the array is empty

## Throws

If values array is null or undefined

## Example

```typescript
const median = calculateMedian([10, 20, 30, 40, 50]);
// Returns: 30

const medianEven = calculateMedian([10, 20, 30, 40]);
// Returns: 25 (average of 20 and 30)
```
