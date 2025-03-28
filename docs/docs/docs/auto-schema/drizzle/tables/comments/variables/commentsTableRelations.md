[Admin Docs](/)

***

# Variable: commentsTableRelations

> `const` **commentsTableRelations**: `Relations`\<`"comments"`, \{ `creator`: `One`\<`"users"`, `false`\>; `post`: `One`\<`"posts"`, `true`\>; `votesWhereComment`: `Many`\<`"comment_votes"`\>; \}\>

Defined in: [src/drizzle/tables/comments.ts:67](https://github.com/NishantSinghhhhh/talawa-api/blob/097322c0353ac6926bd36bdd4ea38c52c0dfde5d/src/drizzle/tables/comments.ts#L67)
