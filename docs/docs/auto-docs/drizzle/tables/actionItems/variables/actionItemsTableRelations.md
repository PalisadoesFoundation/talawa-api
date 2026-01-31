[API Docs](/)

***

# Variable: actionItemsTableRelations

> `const` **actionItemsTableRelations**: `Relations`\<`"actionitems"`, \{ `category`: `One`\<`"actionitem_categories"`, `false`\>; `creator`: `One`\<`"users"`, `false`\>; `event`: `One`\<`"events"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `recurringEventInstance`: `One`\<`"recurring_event_instances"`, `false`\>; `updater`: `One`\<`"users"`, `false`\>; `volunteer`: `One`\<`"event_volunteers"`, `false`\>; `volunteerGroup`: `One`\<`"event_volunteer_groups"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/actionItems.ts:111](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/actionItems.ts#L111)
