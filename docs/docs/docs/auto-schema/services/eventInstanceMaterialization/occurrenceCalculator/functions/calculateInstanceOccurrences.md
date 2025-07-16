[Admin Docs](/)

***

# Function: calculateInstanceOccurrences()

> **calculateInstanceOccurrences**(`config`, `logger`): [`CalculatedOccurrence`](../../types/interfaces/CalculatedOccurrence.md)[]

Defined in: [src/services/eventInstanceMaterialization/occurrenceCalculator.ts:15](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/services/eventInstanceMaterialization/occurrenceCalculator.ts#L15)

Calculates instance occurrence times based on recurrence rules and exceptions.
Handles daily, weekly, monthly, and yearly frequencies with proper exception handling.

## Parameters

### config

[`OccurrenceCalculationConfig`](../../types/interfaces/OccurrenceCalculationConfig.md)

### logger

`FastifyBaseLogger`

## Returns

[`CalculatedOccurrence`](../../types/interfaces/CalculatedOccurrence.md)[]
