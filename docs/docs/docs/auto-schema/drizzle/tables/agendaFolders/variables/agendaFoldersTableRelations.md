[Admin Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaFoldersWhereParentFolder`: `Many`\<`"agenda_folders"`\>; `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `parentFolder`: `One`\<`"agenda_folders"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

## Defined in

[src/drizzle/tables/agendaFolders.ts:99](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/drizzle/tables/agendaFolders.ts#L99)
