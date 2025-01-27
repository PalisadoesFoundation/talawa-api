[**talawa-api**](../../../README.md)

***

# Interface: InterfaceFundraisingCampaignPledges

Interface representing a document for a fundraising campaign pledge in the database (MongoDB).

## Properties

### \_id

> **\_id**: `ObjectId`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:15](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L15)

***

### amount

> **amount**: `number`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:20](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L20)

***

### campaign

> **campaign**: `PopulatedDoc`\<[`InterfaceFundraisingCampaign`](../../FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md) & `Document`\>

#### Defined in

[src/models/FundraisingCampaignPledge.ts:16](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L16)

***

### createdAt

> **createdAt**: `Date`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:22](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L22)

***

### currency

> **currency**: [`CurrencyType`](../../FundraisingCampaign/enumerations/CurrencyType.md)

#### Defined in

[src/models/FundraisingCampaignPledge.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L21)

***

### endDate

> **endDate**: `Date`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:19](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L19)

***

### startDate

> **startDate**: `Date`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:18](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L18)

***

### updatedAt

> **updatedAt**: `Date`

#### Defined in

[src/models/FundraisingCampaignPledge.ts:23](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L23)

***

### users

> **users**: `PopulatedDoc`\<[`InterfaceUser`](../../User/interfaces/InterfaceUser.md) & `Document`\>[]

#### Defined in

[src/models/FundraisingCampaignPledge.ts:17](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/FundraisingCampaignPledge.ts#L17)
