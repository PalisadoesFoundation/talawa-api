[Admin Docs](/)

***

# Variable: chatMembershipsTableRelations

> `const` **chatMembershipsTableRelations**: `Relations`\<`"chat_memberships"`, \{ `chat`: `One`\<`"chats"`, `true`\>; `creator`: `One`\<`"users"`, `false`\>; `member`: `One`\<`"users"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chatMemberships.ts:92](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/drizzle/tables/chatMemberships.ts#L92)
