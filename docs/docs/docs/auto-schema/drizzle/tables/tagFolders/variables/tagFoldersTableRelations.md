[Admin Docs](/)

***

# Variable: tagFoldersTableRelations

> `const` **tagFoldersTableRelations**: `Relations`\<`"tag_folders"`, \{ `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `parentFolder`: `One`\<`"tag_folders"`, `false`\>; `tagFoldersWhereParentFolder`: `Many`\<`"tag_folders"`\>; `tagsWhereFolder`: `Many`\<`"tags"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/tagFolders.ts:93](https://github.com/syedali237/talawa-api/blob/2d0d513d5268a339b8dac6b4711f8e71e79fc0e4/src/drizzle/tables/tagFolders.ts#L93)
