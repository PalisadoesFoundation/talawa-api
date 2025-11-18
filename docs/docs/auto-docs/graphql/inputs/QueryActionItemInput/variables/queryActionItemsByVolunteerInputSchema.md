[API Docs](/)

***

# Variable: queryActionItemsByVolunteerInputSchema

> `const` **queryActionItemsByVolunteerInputSchema**: `ZodObject`\<\{ `organizationId`: `ZodOptional`\<`ZodString`\>; `volunteerId`: `ZodNullable`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `organizationId?`: `string`; `volunteerId`: `null` \| `string`; \}, \{ `organizationId?`: `string`; `volunteerId`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/QueryActionItemInput.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/QueryActionItemInput.ts#L32)

Defines the Zod validation schema for querying ActionItems by volunteerId.
