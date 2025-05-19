[Admin Docs](/)

***

# Variable: advertisementsTableRelations

> `const` **advertisementsTableRelations**: `Relations`\<`"advertisements"`, \{ `attachmentsWhereAdvertisement`: `Many`\<`"advertisement_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/advertisements.ts:111](https://github.com/PalisadoesFoundation/talawa-api/blob/c34688c69eb12a5eb721ebc8a0cd60b53e5fbf81/src/drizzle/tables/advertisements.ts#L111)
