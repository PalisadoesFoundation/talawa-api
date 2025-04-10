[Admin Docs](/)

***

# Variable: commentsTableRelations

> `const` **commentsTableRelations**: `Relations`\<`"comments"`, \{ `creator`: `One`\<`"users"`, `false`\>; `post`: `One`\<`"posts"`, `true`\>; `votesWhereComment`: `Many`\<`"comment_votes"`\>; \}\>

Defined in: [src/drizzle/tables/comments.ts:67](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/drizzle/tables/comments.ts#L67)
