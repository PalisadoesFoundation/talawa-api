[Admin Docs](/)

***

# Variable: queryActionItemsByUserInputSchema

> `const` **queryActionItemsByUserInputSchema**: `ZodObject`\<\{ `organizationId`: `ZodOptional`\<`ZodString`\>; `userId`: `ZodNullable`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/QueryActionItemInput.ts:32](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/QueryActionItemInput.ts#L32)

Defines the Zod validation schema for querying ActionItems by userId.
