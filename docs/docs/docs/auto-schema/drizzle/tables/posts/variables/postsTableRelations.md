[Admin Docs](/)

***

# Variable: postsTableRelations

> `const` **postsTableRelations**: `Relations`\<`"posts"`, \{ `attachmentsWherePost`: `Many`\<`"post_attachments"`\>; `commentsWherePost`: `Many`\<`"comments"`\>; `creator`: `One`\<`"users"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `votesWherePost`: `Many`\<`"post_votes"`\>; \}\>

Defined in: src/drizzle/tables/posts.ts:87
