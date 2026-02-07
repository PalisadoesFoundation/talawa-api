[**talawa-api**](../../../../README.md)

***

# Variable: mutationCreateAdvertisementInputSchema

> `const` **mutationCreateAdvertisementInputSchema**: `ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimeType`: `ZodEnum`\<\{ `image/avif`: `"image/avif"`; `image/jpeg`: `"image/jpeg"`; `image/png`: `"image/png"`; `image/webp`: `"image/webp"`; `video/mp4`: `"video/mp4"`; `video/quicktime`: `"video/quicktime"`; `video/webm`: `"video/webm"`; \}\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `$strip`\>\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `endAt`: `ZodDate`; `name`: `ZodString`; `organizationId`: `ZodUUID`; `startAt`: `ZodDate`; `type`: `ZodString`; \}, \{ \}\>

Defined in: [src/graphql/inputs/MutationCreateAdvertisementInput.ts:10](https://github.com/singhaditya73/talawa-api/blob/397b121785b927051c43066aea225a0a1410ee72/src/graphql/inputs/MutationCreateAdvertisementInput.ts#L10)
