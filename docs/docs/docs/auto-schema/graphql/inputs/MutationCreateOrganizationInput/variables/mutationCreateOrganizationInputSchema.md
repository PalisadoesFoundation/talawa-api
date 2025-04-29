[Admin Docs](/)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; \}, `"name"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired`: `boolean`; `name`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:7](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/graphql/inputs/MutationCreateOrganizationInput.ts#L7)
