[Admin Docs](/)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; \}, `"name"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:7](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/graphql/inputs/MutationCreateOrganizationInput.ts#L7)
