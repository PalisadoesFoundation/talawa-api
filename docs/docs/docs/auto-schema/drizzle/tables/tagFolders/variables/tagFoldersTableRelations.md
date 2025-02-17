[Admin Docs](/)

***

# Variable: tagFoldersTableRelations

> `const` **tagFoldersTableRelations**: `Relations`\<`"tag_folders"`, \{ `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `parentFolder`: `One`\<`"tag_folders"`, `false`\>; `tagFoldersWhereParentFolder`: `Many`\<`"tag_folders"`\>; `tagsWhereFolder`: `Many`\<`"tags"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/tagFolders.ts:93](https://github.com/Suyash878/talawa-api/blob/05d9dfc8d9c5928ef559c72f2ab0492d0dbbb48c/src/drizzle/tables/tagFolders.ts#L93)
