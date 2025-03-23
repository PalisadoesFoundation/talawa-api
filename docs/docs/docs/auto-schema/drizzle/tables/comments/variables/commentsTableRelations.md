[Admin Docs](/)

***

# Variable: commentsTableRelations

> `const` **commentsTableRelations**: `Relations`\<`"comments"`, \{ `creator`: `One`\<`"users"`, `false`\>; `post`: `One`\<`"posts"`, `true`\>; `votesWhereComment`: `Many`\<`"comment_votes"`\>; \}\>

Defined in: [src/drizzle/tables/comments.ts:67](https://github.com/NishantSinghhhhh/talawa-api/blob/d7e8fb10f99b66342acb17768b9755553b21ad54/src/drizzle/tables/comments.ts#L67)
