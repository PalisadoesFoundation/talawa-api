[Admin Docs](/)

***

# Variable: tagFoldersTableRelations

> `const` **tagFoldersTableRelations**: `Relations`\<`"tag_folders"`, \{ `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `parentFolder`: `One`\<`"tag_folders"`, `false`\>; `tagFoldersWhereParentFolder`: `Many`\<`"tag_folders"`\>; `tagsWhereFolder`: `Many`\<`"tags"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/tagFolders.ts:93](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/drizzle/tables/tagFolders.ts#L93)
