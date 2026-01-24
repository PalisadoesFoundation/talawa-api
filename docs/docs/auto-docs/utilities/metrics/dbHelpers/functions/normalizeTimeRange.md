[**talawa-api**](../../../../README.md)

***

# Function: normalizeTimeRange()

> **normalizeTimeRange**(`startTime`, `endTime`): `object`

Defined in: [src/utilities/metrics/dbHelpers.ts:319](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/dbHelpers.ts#L319)

Normalizes a time range to ensure valid start and end times.
If startTime is after endTime, they are swapped.
If either is invalid, an error is thrown.

## Parameters

### startTime

`Date`

Start time of the range

### endTime

`Date`

End time of the range

## Returns

`object`

Normalized time range with start and end properties

### end

> **end**: `Date`

### start

> **start**: `Date`

## Throws

If either time is invalid

## Example

```typescript
const range = normalizeTimeRange(
  new Date('2024-01-01T12:00:00Z'),
  new Date('2024-01-01T10:00:00Z')
);
// Returns: { start: endTime, end: startTime } (swapped)
```
