[**talawa-api**](../../../README.md)

***

# Type Alias: FundraisingCampaign

> **FundraisingCampaign**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"FundraisingCampaign"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### currency

> **currency**: [`Currency`](Currency.md)

### endDate

> **endDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### fundId

> **fundId**: [`Fund`](Fund.md)

### fundingGoal

> **fundingGoal**: [`Scalars`](Scalars.md)\[`"Float"`\]\[`"output"`\]

### name

> **name**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### organizationId

> **organizationId**: [`Organization`](Organization.md)

### pledges?

> `optional` **pledges**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)\>[]\>

### startDate

> **startDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

## Defined in

[src/types/generatedGraphQLTypes.ts:1062](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/types/generatedGraphQLTypes.ts#L1062)
