[Admin Docs](/)

***

# Variable: advertisementsTableRelations

> `const` **advertisementsTableRelations**: `Relations`\<`"advertisements"`, \{ `attachmentsWhereAdvertisement`: `Many`\<`"advertisement_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/advertisements.ts:111](https://github.com/PalisadoesFoundation/talawa-api/blob/720213b8973f1ef622d2c99f376ffc6c960847d1/src/drizzle/tables/advertisements.ts#L111)
