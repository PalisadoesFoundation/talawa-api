[API Docs](/)

***

# Function: getTimeWindows()

> **getTimeWindows**(`startTime`, `endTime`, `options?`): [`TimeWindow`](../interfaces/TimeWindow.md)[]

Defined in: [src/utilities/metrics/dbHelpers.ts:236](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L236)

Generates an array of time windows for a given time range.
Windows are non-overlapping and cover the entire range.

## Parameters

### startTime

`Date`

Start time of the range

### endTime

`Date`

End time of the range

### options?

[`TimeWindowOptions`](../interfaces/TimeWindowOptions.md)

Optional configuration for window generation

## Returns

[`TimeWindow`](../interfaces/TimeWindow.md)[]

Array of time windows

## Throws

If startTime is after endTime

## Throws

If windowSizeMs is invalid

## Example

```typescript
const windows = getTimeWindows(
  new Date('2024-01-01T00:00:00Z'),
  new Date('2024-01-01T01:00:00Z'),
  { windowSizeMs: 15 * 60 * 1000 } // 15 minutes
);
// Returns 4 windows of 15 minutes each
```
