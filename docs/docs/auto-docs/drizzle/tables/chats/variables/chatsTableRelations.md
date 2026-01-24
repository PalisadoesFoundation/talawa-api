[**talawa-api**](../../../../README.md)

***

# Variable: chatsTableRelations

> `const` **chatsTableRelations**: `Relations`\<`"chats"`, \{ `chatMembershipsWhereChat`: `Many`\<`"chat_memberships"`\>; `chatMessagesWhereChat`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chats.ts:92](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/chats.ts#L92)
