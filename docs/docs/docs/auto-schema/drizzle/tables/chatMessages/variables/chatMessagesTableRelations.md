[Admin Docs](/)

***

# Variable: chatMessagesTableRelations

> `const` **chatMessagesTableRelations**: `Relations`\<`"chat_messages"`, \{ `chat`: `One`\<`"chats"`, `true`\>; `chatMessagesWhereParentMessage`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `parentMessage`: `One`\<`"chat_messages"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chatMessages.ts:84](https://github.com/PurnenduMIshra129th/talawa-api/blob/4d9be178e903c8bd2778a802379c92eee9a2afdf/src/drizzle/tables/chatMessages.ts#L84)
