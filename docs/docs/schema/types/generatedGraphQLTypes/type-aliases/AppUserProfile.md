[**talawa-api**](../../../README.md)

***

# Type Alias: AppUserProfile

> **AppUserProfile**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"AppUserProfile"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### adminFor?

> `optional` **adminFor**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>[]\>

### appLanguageCode

> **appLanguageCode**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### campaigns?

> `optional` **campaigns**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`FundraisingCampaign`](FundraisingCampaign.md)\>[]\>

### createdEvents?

> `optional` **createdEvents**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### createdOrganizations?

> `optional` **createdOrganizations**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>[]\>

### eventAdmin?

> `optional` **eventAdmin**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### isSuperAdmin

> **isSuperAdmin**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### pledges?

> `optional` **pledges**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)\>[]\>

### pluginCreationAllowed

> **pluginCreationAllowed**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### userId

> **userId**: [`User`](User.md)

## Defined in

[src/types/generatedGraphQLTypes.ts:240](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L240)
