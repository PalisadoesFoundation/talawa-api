[**talawa-api**](../../../../../README.md)

***

# Function: getWhere()

> **getWhere**\<`T`\>(`where`): `FilterQuery`\<`T`\>

This function returns FilterQuery object which can be used to find out documents matching specific args as mentioned in `where`.
When modifying this function, check if the arg to be added isn't present before, and place `where` argument
type if not present before in the intersection type.

## Type Parameters

• **T** = `unknown`

used to return an object of a generic type `FilterQuery<T>`

## Parameters

### where

`Partial`\<[`EventWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/EventWhereInput.md) & [`EventVolunteerGroupWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/EventVolunteerGroupWhereInput.md) & [`OrganizationWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/OrganizationWhereInput.md) & [`PostWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/PostWhereInput.md) & [`UserWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/UserWhereInput.md) & [`DonationWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/DonationWhereInput.md) & [`ActionItemWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/ActionItemWhereInput.md) & [`ActionItemCategoryWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/ActionItemCategoryWhereInput.md) & [`AgendaItemCategoryWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/AgendaItemCategoryWhereInput.md) & [`CampaignWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/CampaignWhereInput.md) & [`FundWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/FundWhereInput.md) & [`PledgeWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/PledgeWhereInput.md) & [`VenueWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/VenueWhereInput.md) & [`ChatWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/ChatWhereInput.md) & [`EventVolunteerWhereInput`](../../../../../types/generatedGraphQLTypes/type-aliases/EventVolunteerWhereInput.md)\>

an object that contains properties that can be used to filter out documents.

## Returns

`FilterQuery`\<`T`\>

a FilterQuery object to filter out documents

## Remarks

You can learn about Generics [here](https://www.typescriptlang.org/docs/handbook/2/generics.html).

## Example

```
const inputArgs = getWhere<InterfaceEvent>(args.where);
```

## Defined in

[src/resolvers/Query/helperFunctions/getWhere.ts:34](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/helperFunctions/getWhere.ts#L34)
