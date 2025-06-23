[Admin Docs](/)

***

# Variable: advertisementsTableRelations

> `const` **advertisementsTableRelations**: `Relations`\<`"advertisements"`, \{ `attachmentsWhereAdvertisement`: `Many`\<`"advertisement_attachments"`\>; `creator`: `One`\<`"users"`, `false`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/advertisements.ts:111](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/drizzle/tables/advertisements.ts#L111)
