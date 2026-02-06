[API Docs](/)

***

# Variable: createPostInput

> `const` **createPostInput**: `ZodObject`\<\{ `body`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `organizationId`: `ZodString`; `tags`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`\>\>\>; `title`: `ZodString`; `visibility`: `ZodDefault`\<`ZodEnum`\<\{ `private`: `"private"`; `public`: `"public"`; \}\>\>; \}, `$strip`\>

Defined in: [src/graphql/validators/core.ts:194](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/validators/core.ts#L194)

Example: Create post input schema.
Demonstrates how to compose shared validators into domain-specific schemas.
