[Admin Docs](/)

***

# Variable: commentsTableRelations

> `const` **commentsTableRelations**: `Relations`\<`"comments"`, \{ `creator`: `One`\<`"users"`, `false`\>; `post`: `One`\<`"posts"`, `true`\>; `votesWhereComment`: `Many`\<`"comment_votes"`\>; \}\>

Defined in: [src/drizzle/tables/comments.ts:67](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/drizzle/tables/comments.ts#L67)
