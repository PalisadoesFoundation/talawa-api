[**talawa-api**](../../../../README.md)

***

# Variable: mutationUpdateVenueInputSchema

> `const` **mutationUpdateVenueInputSchema**: `ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimeType`: `ZodEnum`\<\{ `image/avif`: `"image/avif"`; `image/jpeg`: `"image/jpeg"`; `image/png`: `"image/png"`; `image/webp`: `"image/webp"`; `video/mp4`: `"video/mp4"`; `video/quicktime`: `"video/quicktime"`; `video/webm`: `"video/webm"`; \}\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `$strip`\>\>\>; `capacity`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `description`: `ZodOptional`\<`ZodString`\>; `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}, \{ \}\>

Defined in: [src/graphql/inputs/MutationUpdateVenueInput.ts:10](https://github.com/singhaditya73/talawa-api/blob/6cb225887a9e743923526ec6d68068bcba50348c/src/graphql/inputs/MutationUpdateVenueInput.ts#L10)
