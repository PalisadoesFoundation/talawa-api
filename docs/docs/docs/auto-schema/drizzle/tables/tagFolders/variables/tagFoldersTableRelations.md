[Admin Docs](/)

***

# Variable: tagFoldersTableRelations

> `const` **tagFoldersTableRelations**: `Relations`\<`"tag_folders"`, \{ `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `parentFolder`: `One`\<`"tag_folders"`, `false`\>; `tagFoldersWhereParentFolder`: `Many`\<`"tag_folders"`\>; `tagsWhereFolder`: `Many`\<`"tags"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/tagFolders.ts:93](https://github.com/NishantSinghhhhh/talawa-api/blob/3b12506812825c5581bdb63c64252031697d198c/src/drizzle/tables/tagFolders.ts#L93)
