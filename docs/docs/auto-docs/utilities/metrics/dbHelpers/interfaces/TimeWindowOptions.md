[API Docs](/)

***

# Interface: TimeWindowOptions

Defined in: src/utilities/metrics/dbHelpers.ts:192

Options for generating time windows.

## Properties

### alignToBoundaries?

> `optional` **alignToBoundaries**: `boolean`

Defined in: src/utilities/metrics/dbHelpers.ts:202

Whether to align windows to boundaries (e.g., minute boundaries).
Defaults to false.

***

### windowSizeMs?

> `optional` **windowSizeMs**: `number`

Defined in: src/utilities/metrics/dbHelpers.ts:197

Size of each time window in milliseconds.
Defaults to 60000 (1 minute).
