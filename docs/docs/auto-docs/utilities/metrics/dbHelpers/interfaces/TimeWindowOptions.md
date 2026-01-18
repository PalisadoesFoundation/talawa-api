[API Docs](/)

***

# Interface: TimeWindowOptions

Defined in: [src/utilities/metrics/dbHelpers.ts:156](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L156)

Options for generating time windows.

## Properties

### alignToBoundaries?

> `optional` **alignToBoundaries**: `boolean`

Defined in: [src/utilities/metrics/dbHelpers.ts:166](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L166)

Whether to align windows to boundaries (e.g., minute boundaries).
Defaults to false.

***

### windowSizeMs?

> `optional` **windowSizeMs**: `number`

Defined in: [src/utilities/metrics/dbHelpers.ts:161](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/metrics/dbHelpers.ts#L161)

Size of each time window in milliseconds.
Defaults to 60000 (1 minute).
