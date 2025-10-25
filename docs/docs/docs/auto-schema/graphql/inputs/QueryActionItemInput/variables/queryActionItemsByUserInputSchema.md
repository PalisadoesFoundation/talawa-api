[Admin Docs](/)

***

# Variable: queryActionItemsByUserInputSchema

> `const` **queryActionItemsByUserInputSchema**: `ZodObject`\<\{ `organizationId`: `ZodOptional`\<`ZodString`\>; `userId`: `ZodNullable`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/QueryActionItemInput.ts:32](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/graphql/inputs/QueryActionItemInput.ts#L32)

Defines the Zod validation schema for querying ActionItems by userId.
