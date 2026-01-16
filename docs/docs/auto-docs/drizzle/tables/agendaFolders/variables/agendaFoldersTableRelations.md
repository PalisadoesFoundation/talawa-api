[API Docs](/)

***

# Variable: agendaFoldersTableRelations

> `const` **agendaFoldersTableRelations**: `Relations`\<`"agenda_folders"`, \{ `agendaItemsWhereFolder`: `Many`\<`"agenda_items"`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `true`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaFolders.ts:106](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/agendaFolders.ts#L106)
