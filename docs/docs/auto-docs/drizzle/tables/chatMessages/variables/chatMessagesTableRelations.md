[**talawa-api**](../../../../README.md)

***

# Variable: chatMessagesTableRelations

> `const` **chatMessagesTableRelations**: `Relations`\<`"chat_messages"`, \{ `chat`: `One`\<`"chats"`, `true`\>; `chatMessagesWhereParentMessage`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `parentMessage`: `One`\<`"chat_messages"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chatMessages.ts:84](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/drizzle/tables/chatMessages.ts#L84)
