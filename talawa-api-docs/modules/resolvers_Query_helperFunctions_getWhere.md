[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/helperFunctions/getWhere

# Module: resolvers/Query/helperFunctions/getWhere

## Table of contents

### Functions

- [getWhere](resolvers_Query_helperFunctions_getWhere.md#getwhere)

## Functions

### getWhere

▸ **getWhere**\<`T`\>(`where`): `FilterQuery`\<`T`\>

This function returns FilterQuery object which can be used to find out documents matching specific args as mentioned in `where`.
When modifying this function, check if the arg to be added isn't present before, and place `where` argument
type if not present before in the intersection type.

#### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `unknown` | used to return an object of a generic type `FilterQuery<T>` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `where` | `undefined` \| [`InputMaybe`](types_generatedGraphQLTypes.md#inputmaybe)\<`Partial`\<[`EventWhereInput`](types_generatedGraphQLTypes.md#eventwhereinput) & [`OrganizationWhereInput`](types_generatedGraphQLTypes.md#organizationwhereinput) & [`PostWhereInput`](types_generatedGraphQLTypes.md#postwhereinput) & [`UserWhereInput`](types_generatedGraphQLTypes.md#userwhereinput) & [`DonationWhereInput`](types_generatedGraphQLTypes.md#donationwhereinput)\>\> | an object that contains properties that can be used to filter out documents. |

#### Returns

`FilterQuery`\<`T`\>

a FilterQuery object to filter out documents

**`Remarks`**

You can learn about Generics [here](https://www.typescriptlang.org/docs/handbook/2/generics.html).

**`Example`**

```
const inputArgs = getWhere<InterfaceEvent>(args.where);
```

#### Defined in

[src/resolvers/Query/helperFunctions/getWhere.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/7fc03c3/src/resolvers/Query/helperFunctions/getWhere.ts#L24)
