[API Docs](/)

***

# Variable: agendaItemsTableRelations

> `const` **agendaItemsTableRelations**: `Relations`\<`"agenda_items"`, \{ `attachmentsWhereAgendaItem`: `Many`\<`"agenda_item_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `folder`: `One`\<`"agenda_folders"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; `urlsWhereAgendaItem`: `Many`\<`"agenda_item_url"`\>; \}\>

Defined in: src/drizzle/tables/agendaItems.ts:96
