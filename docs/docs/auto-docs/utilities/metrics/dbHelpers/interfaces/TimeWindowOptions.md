[API Docs](/)

***

# Interface: TimeWindowOptions

Defined in: [src/utilities/metrics/dbHelpers.ts:182](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L182)

Options for generating time windows.

## Properties

### alignToBoundaries?

> `optional` **alignToBoundaries**: `boolean`

Defined in: [src/utilities/metrics/dbHelpers.ts:192](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L192)

Whether to align windows to boundaries (e.g., minute boundaries).
Defaults to false.

***

### windowSizeMs?

> `optional` **windowSizeMs**: `number`

Defined in: [src/utilities/metrics/dbHelpers.ts:187](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L187)

Size of each time window in milliseconds.
Defaults to 60000 (1 minute).
