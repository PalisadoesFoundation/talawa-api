[Admin Docs](/)

***

# Variable: chatMessagesTableRelations

> `const` **chatMessagesTableRelations**: `Relations`\<`"chat_messages"`, \{ `chat`: `One`\<`"chats"`, `true`\>; `chatMessagesWhereParentMessage`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `parentMessage`: `One`\<`"chat_messages"`, `false`\>; \}\>

## Defined in

[src/drizzle/tables/chatMessages.ts:84](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/drizzle/tables/chatMessages.ts#L84)
