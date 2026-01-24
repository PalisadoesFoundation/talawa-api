[API Docs](/)

***

# Variable: userNotificationSchema

> `const` **userNotificationSchema**: `ZodObject`\<\{ `createdAt`: `ZodDate`; `eventType`: `ZodString`; `id`: `ZodString`; `isRead`: `ZodBoolean`; `navigation`: `ZodNullable`\<`ZodString`\>; `readAt`: `ZodNullable`\<`ZodDate`\>; `renderedContent`: `ZodObject`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `$loose`\>; \}, `$strip`\>

Defined in: src/graphql/types/Notification/NotificationResponse.ts:5
