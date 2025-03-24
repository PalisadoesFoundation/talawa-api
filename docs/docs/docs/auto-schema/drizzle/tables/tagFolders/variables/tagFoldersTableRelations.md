[Admin Docs](/)

***

# Variable: tagFoldersTableRelations

> `const` **tagFoldersTableRelations**: `Relations`\<`"tag_folders"`, \{ `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `parentFolder`: `One`\<`"tag_folders"`, `false`\>; `tagFoldersWhereParentFolder`: `Many`\<`"tag_folders"`\>; `tagsWhereFolder`: `Many`\<`"tags"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/tagFolders.ts:93](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/drizzle/tables/tagFolders.ts#L93)
