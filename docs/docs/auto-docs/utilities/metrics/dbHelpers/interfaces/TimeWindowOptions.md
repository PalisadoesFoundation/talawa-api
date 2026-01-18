[API Docs](/)

***

# Interface: TimeWindowOptions

Defined in: [src/utilities/metrics/dbHelpers.ts:188](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L188)

Options for generating time windows.

## Properties

### alignToBoundaries?

> `optional` **alignToBoundaries**: `boolean`

Defined in: [src/utilities/metrics/dbHelpers.ts:198](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L198)

Whether to align windows to boundaries (e.g., minute boundaries).
Defaults to false.

***

### windowSizeMs?

> `optional` **windowSizeMs**: `number`

Defined in: [src/utilities/metrics/dbHelpers.ts:193](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L193)

Size of each time window in milliseconds.
Defaults to 60000 (1 minute).
