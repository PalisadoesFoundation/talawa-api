[Admin Docs](/)

***

# Variable: chatsTableRelations

> `const` **chatsTableRelations**: `Relations`\<`"chats"`, \{ `chatMembershipsWhereChat`: `Many`\<`"chat_memberships"`\>; `chatMessagesWhereChat`: `Many`\<`"chat_messages"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/chats.ts:91](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/drizzle/tables/chats.ts#L91)
