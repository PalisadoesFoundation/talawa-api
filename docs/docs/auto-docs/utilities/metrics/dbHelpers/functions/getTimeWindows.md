[**talawa-api**](../../../../README.md)

***

# Function: getTimeWindows()

> **getTimeWindows**(`startTime`, `endTime`, `options?`): [`TimeWindow`](../interfaces/TimeWindow.md)[]

Defined in: [src/utilities/metrics/dbHelpers.ts:249](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/metrics/dbHelpers.ts#L249)

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
  - `windowSizeMs`: Size of each window in milliseconds (default: 60000 = 1 minute)
  - `alignToBoundaries`: When true, aligns windows to fixed time boundaries
    (e.g., minute or hour boundaries) by flooring the startTime to the nearest
    windowSizeMs multiple. This ensures consistent bucketing but may cause the
    first window's start time to precede the requested startTime.

## Returns

[`TimeWindow`](../interfaces/TimeWindow.md)[]

Array of time windows

## Throws

If startTime or endTime is invalid

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

// With alignToBoundaries: true, if startTime is 10:00:15,
// the first window will start at 10:00:00 (aligned to minute boundary)
```
