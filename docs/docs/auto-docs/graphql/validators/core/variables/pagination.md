[API Docs](/)

***

# Variable: pagination

> `const` **pagination**: `ZodObject`\<\{ `cursor`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `null`, `string` \| `null` \| `undefined`\>\>; `limit`: `ZodDefault`\<`ZodCoercedNumber`\<`unknown`\>\>; \}, `$strip`\>

Defined in: [src/graphql/validators/core.ts:141](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/validators/core.ts#L141)

Unified pagination schema with sensible defaults and bounds.

Defaults:
- limit: 20
- cursor: null

Constraints:
- limit must be between 1 and 100 (inclusive)
- cursor is optional and nullable
