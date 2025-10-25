[Admin Docs](/)

***

# Variable: mutationCreateFundCampaignPledgeInputSchema

> `const` **mutationCreateFundCampaignPledgeInputSchema**: `ZodObject`\<`Pick`\<\{ `amount`: `ZodNumber`; `campaignId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `note`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `pledgerId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"note"` \| `"amount"` \| `"campaignId"` \| `"pledgerId"`\>, `"strip"`, `ZodTypeAny`, \{ `amount`: `number`; `campaignId`: `string`; `note?`: `null` \| `string`; `pledgerId`: `string`; \}, \{ `amount`: `number`; `campaignId`: `string`; `note?`: `null` \| `string`; `pledgerId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateFundCampaignPledgeInput.ts:5](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/inputs/MutationCreateFundCampaignPledgeInput.ts#L5)
