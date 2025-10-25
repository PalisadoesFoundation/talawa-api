[Admin Docs](/)

***

# Variable: userNotificationSchema

> `const` **userNotificationSchema**: `ZodObject`\<\{ `createdAt`: `ZodDate`; `eventType`: `ZodString`; `id`: `ZodString`; `isRead`: `ZodBoolean`; `navigation`: `ZodNullable`\<`ZodString`\>; `readAt`: `ZodNullable`\<`ZodDate`\>; `renderedContent`: `ZodObject`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}\>

Defined in: [src/graphql/types/Notification/NotificationResponse.ts:4](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/types/Notification/NotificationResponse.ts#L4)
