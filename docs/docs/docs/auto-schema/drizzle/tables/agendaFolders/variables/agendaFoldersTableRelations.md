[Admin Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaFoldersWhereParentFolder`: `Many`\<`"agenda_folders"`\>; `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `parentFolder`: `One`\<`"agenda_folders"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaFolders.ts:99](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/drizzle/tables/agendaFolders.ts#L99)
