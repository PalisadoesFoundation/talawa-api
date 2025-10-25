[Admin Docs](/)

***

# Variable: queryActionItemsByUserInputSchema

> `const` **queryActionItemsByUserInputSchema**: `ZodObject`\<\{ `organizationId`: `ZodOptional`\<`ZodString`\>; `userId`: `ZodNullable`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}, \{ `organizationId?`: `string`; `userId`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/QueryActionItemInput.ts:32](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/QueryActionItemInput.ts#L32)

Defines the Zod validation schema for querying ActionItems by userId.
