[API Docs](/)

***

# Variable: agendaItemsTableRelations

> `const` **agendaItemsTableRelations**: `Relations`\<`"agenda_items"`, \{ `attachmentsWhereAgendaItem`: `Many`\<`"agenda_item_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `folder`: `One`\<`"agenda_folders"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/agendaItems.ts:95](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/agendaItems.ts#L95)
