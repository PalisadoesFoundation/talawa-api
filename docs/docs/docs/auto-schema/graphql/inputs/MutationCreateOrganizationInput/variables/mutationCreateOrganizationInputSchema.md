[Admin Docs](/)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; \}, `"name"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:7](https://github.com/PalisadoesFoundation/talawa-api/blob/04adcbca27f07ca5c0bffce211b6e6b77a1828ce/src/graphql/inputs/MutationCreateOrganizationInput.ts#L7)
