[API Docs](/)

***

# Variable: queryActionItemsByVolunteerGroupInputSchema

> `const` **queryActionItemsByVolunteerGroupInputSchema**: `ZodObject`\<\{ `organizationId`: `ZodOptional`\<`ZodString`\>; `volunteerGroupId`: `ZodNullable`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `organizationId?`: `string`; `volunteerGroupId`: `null` \| `string`; \}, \{ `organizationId?`: `string`; `volunteerGroupId`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/QueryActionItemInput.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/QueryActionItemInput.ts#L61)

Defines the Zod validation schema for querying ActionItems by volunteerGroupId.
