[**talawa-api**](../../../../README.md)

***

# Variable: mutationCreateOrganizationInputSchema

> `const` **mutationCreateOrganizationInputSchema**: `ZodObject`\<\{ `addressLine1`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `addressLine2`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimeType`: `ZodEnum`\<\{ `image/avif`: `"image/avif"`; `image/jpeg`: `"image/jpeg"`; `image/png`: `"image/png"`; `image/webp`: `"image/webp"`; `video/mp4`: `"video/mp4"`; `video/quicktime`: `"video/quicktime"`; `video/webm`: `"video/webm"`; \}\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `$strip`\>\>\>; `city`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `isUserRegistrationRequired`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `name`: `ZodString`; `postalCode`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `state`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; \}, \{ \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationInput.ts:10](https://github.com/singhaditya73/talawa-api/blob/397b121785b927051c43066aea225a0a1410ee72/src/graphql/inputs/MutationCreateOrganizationInput.ts#L10)
