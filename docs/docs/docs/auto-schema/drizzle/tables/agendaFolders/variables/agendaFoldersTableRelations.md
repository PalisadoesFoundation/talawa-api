[Admin Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaFoldersWhereParentFolder`: `Many`\<`"agenda_folders"`\>; `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `parentFolder`: `One`\<`"agenda_folders"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaFolders.ts:99](https://github.com/PratapRathi/talawa-api/blob/72aae1e3507e4dd8ad32a69696c05d569e0ed095/src/drizzle/tables/agendaFolders.ts#L99)
