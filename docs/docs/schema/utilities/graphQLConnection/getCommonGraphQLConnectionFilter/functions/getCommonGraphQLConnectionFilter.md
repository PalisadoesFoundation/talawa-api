[**talawa-api**](../../../../README.md)

***

# Function: getCommonGraphQLConnectionFilter()

> **getCommonGraphQLConnectionFilter**(`__namedParameters`): `CommonGraphQLConnectionFilter`

This function is used to get an object containing common mongoose filtering logic.

## Parameters

### \_\_namedParameters

#### cursor

`string`

#### direction

[`GraphQLConnectionTraversalDirection`](../../type-aliases/GraphQLConnectionTraversalDirection.md)

## Returns

`CommonGraphQLConnectionFilter`

## Remarks

Here are a few assumptions this function makes which are common to most of the
graphQL connections.

The entity that has the latest creation datetime must appear at the top of the connection. This
means the default filtering logic would be to filter in descending order by the time of creation of
an entity, and if two or more entities have the same time of creation filtering in descending order
by the primary key of the entity. MongoDB object ids are lexographically sortable all on their own
because they contain information about both the creation time and primary key for the document.

Therefore, this function only returns filtering logic for filtering by the object id of a mongoDB
document.

## Example

```ts
const filter = getCommonGraphQLConnectionFilter({
 cursor: "65da3f8df35eb5bfd52c5368",
 direction: "BACKWARD"
});
const objectList = await User.find(filter).limit(10);
```

## Defined in

[src/utilities/graphQLConnection/getCommonGraphQLConnectionFilter.ts:44](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/graphQLConnection/getCommonGraphQLConnectionFilter.ts#L44)
