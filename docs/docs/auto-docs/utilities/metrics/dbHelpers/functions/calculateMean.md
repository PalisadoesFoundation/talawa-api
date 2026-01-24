[**talawa-api**](../../../../README.md)

***

# Function: calculateMean()

> **calculateMean**(`values`): `number`

Defined in: [src/utilities/metrics/dbHelpers.ts:20](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/dbHelpers.ts#L20)

Calculates the mean (average) of an array of numbers.

## Parameters

### values

`number`[]

Array of numeric values

## Returns

`number`

The mean value, or 0 if the array is empty

## Throws

If values array is null or undefined

## Example

```typescript
const avg = calculateMean([10, 20, 30, 40, 50]);
// Returns: 30
```
