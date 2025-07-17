[Admin Docs](/)

***

# Variable: postsTableRelations

> `const` **postsTableRelations**: `Relations`\<`"posts"`, \{ `attachmentsWherePost`: `Many`\<`"post_attachments"`\>; `commentsWherePost`: `Many`\<`"comments"`\>; `creator`: `One`\<`"users"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `votesWherePost`: `Many`\<`"post_votes"`\>; \}\>

Defined in: [src/drizzle/tables/posts.ts:87](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/drizzle/tables/posts.ts#L87)
