[Admin Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaFoldersWhereParentFolder`: `Many`\<`"agenda_folders"`\>; `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `parentFolder`: `One`\<`"agenda_folders"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaFolders.ts:99](https://github.com/PalisadoesFoundation/talawa-api/blob/9f305099d404e8f36dd8bdadb150fba1e7235da9/src/drizzle/tables/agendaFolders.ts#L99)
