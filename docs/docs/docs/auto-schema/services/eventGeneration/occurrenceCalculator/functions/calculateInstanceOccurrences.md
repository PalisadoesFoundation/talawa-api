[Admin Docs](/)

***

# Function: calculateInstanceOccurrences()

> **calculateInstanceOccurrences**(`config`, `logger`): [`CalculatedOccurrence`](../../types/interfaces/CalculatedOccurrence.md)[]

Defined in: [src/services/eventGeneration/occurrenceCalculator.ts:19](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/services/eventGeneration/occurrenceCalculator.ts#L19)

Calculates the occurrence times for a recurring event based on its recurrence rule,
handling exceptions and various frequencies (daily, weekly, monthly, yearly).

## Parameters

### config

[`OccurrenceCalculationConfig`](../../types/interfaces/OccurrenceCalculationConfig.md)

The configuration object containing the recurrence rule, base event, and time window.

### logger

`FastifyBaseLogger`

The logger for logging debug and informational messages.

## Returns

[`CalculatedOccurrence`](../../types/interfaces/CalculatedOccurrence.md)[]

An array of calculated occurrences, each with its start and end times and metadata.
