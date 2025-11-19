[API Docs](/)

***

# Variable: fundCampaignPledgesTableInsertSchema

> `const` **fundCampaignPledgesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `amount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `campaignId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `note`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `pledgerId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `amount`: (`schema`) => `ZodNumber`; `note`: (`schema`) => `ZodOptional`\<`ZodString`\>; \}\>

Defined in: src/drizzle/tables/fundCampaignPledges.ts:134
