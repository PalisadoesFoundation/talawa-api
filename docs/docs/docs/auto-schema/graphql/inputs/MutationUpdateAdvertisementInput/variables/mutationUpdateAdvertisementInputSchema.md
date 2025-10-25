[Admin Docs](/)

***

# Variable: mutationUpdateAdvertisementInputSchema

> `const` **mutationUpdateAdvertisementInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `endAt`: `ZodDate`; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `startAt`: `ZodDate`; `type`: `ZodEnum`\<\[`"banner"`, `"menu"`, `"pop_up"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"description"`\>, \{ `endAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; `startAt`: `ZodOptional`\<`ZodDate`\>; `type`: `ZodOptional`\<`ZodEnum`\<\[`"banner"`, `"menu"`, `"pop_up"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `description?`: `null` \| `string`; `endAt?`: `Date`; `id`: `string`; `name?`: `string`; `startAt?`: `Date`; `type?`: `"banner"` \| `"menu"` \| `"pop_up"`; \}, \{ `description?`: `null` \| `string`; `endAt?`: `Date`; `id`: `string`; `name?`: `string`; `startAt?`: `Date`; `type?`: `"banner"` \| `"menu"` \| `"pop_up"`; \}\>, \{ `description?`: `null` \| `string`; `endAt?`: `Date`; `id`: `string`; `name?`: `string`; `startAt?`: `Date`; `type?`: `"banner"` \| `"menu"` \| `"pop_up"`; \}, \{ `description?`: `null` \| `string`; `endAt?`: `Date`; `id`: `string`; `name?`: `string`; `startAt?`: `Date`; `type?`: `"banner"` \| `"menu"` \| `"pop_up"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateAdvertisementInput.ts:7](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationUpdateAdvertisementInput.ts#L7)
