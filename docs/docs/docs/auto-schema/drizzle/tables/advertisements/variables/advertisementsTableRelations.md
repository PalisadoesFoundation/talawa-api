[Admin Docs](/)

***

# Variable: advertisementsTableRelations

> `const` **advertisementsTableRelations**: `Relations`\<`"advertisements"`, \{ `attachmentsWhereAdvertisement`: `Many`\<`"advertisement_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/advertisements.ts:111](https://github.com/PalisadoesFoundation/talawa-api/blob/4f56a5331bd7a5f784e82913103662f37b427f3e/src/drizzle/tables/advertisements.ts#L111)
