[Admin Docs](/)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; \}, `"name"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar?`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired?`: `boolean`; `name?`: `any`; \}, \{ `avatar?`: `Promise`\<`FileUpload`\>; `isUserRegistrationRequired?`: `boolean`; `name?`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:7](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/graphql/inputs/MutationCreateOrganizationInput.ts#L7)
