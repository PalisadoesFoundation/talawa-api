[API Docs](/)

***

# Variable: itemsArgumentsSchema

> `const` **itemsArgumentsSchema**: `ZodPipe`\<`ZodPipe`\<`ZodObject`\<\{ `after`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `before`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `first`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; `last`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; \}, `$strip`\>, `ZodTransform`\<`object` & `Omit`\<\{ `after`: `string` \| `undefined`; `before`: `string` \| `undefined`; `first`: `number` \| `undefined`; `last`: `number` \| `undefined`; \}, `"first"` \| `"last"` \| `"before"` \| `"after"`\>, \{ `after`: `string` \| `undefined`; `before`: `string` \| `undefined`; `first`: `number` \| `undefined`; `last`: `number` \| `undefined`; \}\>\>, `ZodTransform`\<\{ `cursor`: \{ `id`: `string`; `name`: `string`; \} \| `undefined`; `isInversed`: `boolean`; `limit`: `number`; \}, `object` & `Omit`\<\{ `after`: `string` \| `undefined`; `before`: `string` \| `undefined`; `first`: `number` \| `undefined`; `last`: `number` \| `undefined`; \}, `"first"` \| `"last"` \| `"before"` \| `"after"`\>\>\>

Defined in: [src/graphql/types/AgendaFolder/items.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/AgendaFolder/items.ts#L19)
