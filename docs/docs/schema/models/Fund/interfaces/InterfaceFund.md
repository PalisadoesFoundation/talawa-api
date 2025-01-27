[**talawa-api**](../../../README.md)

***

# Interface: InterfaceFund

This is an interface representing a document for a fund in the database (MongoDB).
This interface defines the structure and types of data that a fund document will hold.

## Properties

### \_id

> **\_id**: `ObjectId`

#### Defined in

[src/models/Fund.ts:13](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L13)

***

### campaigns

> **campaigns**: `PopulatedDoc`\<[`InterfaceFundraisingCampaign`](../../FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md) & `Document`\>[]

#### Defined in

[src/models/Fund.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L21)

***

### createdAt

> **createdAt**: `Date`

#### Defined in

[src/models/Fund.ts:22](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L22)

***

### creatorId

> **creatorId**: `PopulatedDoc`\<[`InterfaceUser`](../../User/interfaces/InterfaceUser.md) & `Document`\>

#### Defined in

[src/models/Fund.ts:20](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L20)

***

### isArchived

> **isArchived**: `boolean`

#### Defined in

[src/models/Fund.ts:19](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L19)

***

### isDefault

> **isDefault**: `boolean`

#### Defined in

[src/models/Fund.ts:18](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L18)

***

### name

> **name**: `string`

#### Defined in

[src/models/Fund.ts:15](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L15)

***

### organizationId

> **organizationId**: `ObjectId`

#### Defined in

[src/models/Fund.ts:14](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L14)

***

### refrenceNumber

> **refrenceNumber**: `string`

#### Defined in

[src/models/Fund.ts:16](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L16)

***

### taxDeductible

> **taxDeductible**: `boolean`

#### Defined in

[src/models/Fund.ts:17](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L17)

***

### updatedAt

> **updatedAt**: `Date`

#### Defined in

[src/models/Fund.ts:23](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/models/Fund.ts#L23)
