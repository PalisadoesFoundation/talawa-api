[Admin Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaFoldersWhereParentFolder`: `Many`\<`"agenda_folders"`\>; `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `parentFolder`: `One`\<`"agenda_folders"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaFolders.ts:99](https://github.com/NishantSinghhhhh/talawa-api/blob/c589e7bc1eb842c2fd40f1d8b61882c5c36978fe/src/drizzle/tables/agendaFolders.ts#L99)
