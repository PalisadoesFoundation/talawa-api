[Admin Docs](/)

***

# Variable: userNotificationSchema

> `const` **userNotificationSchema**: `ZodObject`\<\{ `createdAt`: `ZodDate`; `eventType`: `ZodString`; `id`: `ZodString`; `isRead`: `ZodBoolean`; `navigation`: `ZodNullable`\<`ZodString`\>; `readAt`: `ZodNullable`\<`ZodDate`\>; `renderedContent`: `ZodObject`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}\>

Defined in: [src/graphql/types/Notification/NotificationResponse.ts:4](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/Notification/NotificationResponse.ts#L4)
