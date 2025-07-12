[Admin Docs](/)

***

# Variable: organizationPostsArgumentsSchema

> `const` **organizationPostsArgumentsSchema**: `ZodEffects`\<`ZodObject`\<\{ `first`: `ZodOptional`\<`ZodNumber`\>; `skip`: `ZodOptional`\<`ZodNumber`\>; `where`: `ZodOptional`\<`ZodObject`\<\{ `caption_contains`: `ZodOptional`\<`ZodString`\>; `creatorId`: `ZodOptional`\<`ZodString`\>; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}, \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `first?`: `number`; `skip?`: `number`; `where?`: \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}; \}, \{ `first?`: `number`; `skip?`: `number`; `where?`: \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}; \}\>, \{ `first`: `number`; `skip`: `number`; `where`: \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}; \}, \{ `first?`: `number`; `skip?`: `number`; `where?`: \{ `caption_contains?`: `string`; `creatorId?`: `string`; `isPinned?`: `boolean`; \}; \}\>

Defined in: src/graphql/inputs/QueryOrganizationPostInput.ts:4
