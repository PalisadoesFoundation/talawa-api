[Admin Docs](/)

***

# Variable: chatMessagesTableRelations

> `const` **chatMessagesTableRelations**: `Relations`\<`"chat_messages"`, \{ `chat`: `One`\<`"chats"`, `true`\>; `chatMessagesWhereParentMessage`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `parentMessage`: `One`\<`"chat_messages"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chatMessages.ts:84](https://github.com/NishantSinghhhhh/talawa-api/blob/69de67039e23da5433da6bf054785223c86c0ed1/src/drizzle/tables/chatMessages.ts#L84)
