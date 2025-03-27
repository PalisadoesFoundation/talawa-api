[Admin Docs](/)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; \}, `"name"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:7](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/graphql/inputs/MutationCreateOrganizationInput.ts#L7)
