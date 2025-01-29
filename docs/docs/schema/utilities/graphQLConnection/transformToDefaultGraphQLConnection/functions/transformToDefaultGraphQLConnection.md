[**talawa-api**](../../../../README.md)

***

# Function: transformToDefaultGraphQLConnection()

> **transformToDefaultGraphQLConnection**\<`T0`, `T1`, `T2`\>(`__namedParameters`): [`DefaultGraphQLConnection`](../../generateDefaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<`T2`\>

This function is used to transform a list of objects to a standard graphQL connection object.

## Type Parameters

• **T0**

• **T1** *extends* `object`

• **T2**

## Parameters

### \_\_namedParameters

[`TransformToDefaultGraphQLConnectionArguments`](../type-aliases/TransformToDefaultGraphQLConnectionArguments.md)\<`T0`, `T1`, `T2`\>

## Returns

[`DefaultGraphQLConnection`](../../generateDefaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<`T2`\>

## Remarks

The logic used in this function is common to almost all graphQL connection creation flows,
abstracting that away into this function lets developers use a declarative way to create the
graphQL connection object they want and prevents code duplication.

## Example

```ts
const [objectList, totalCount] = await Promise.all([
  User.find(filter)
    .sort(sort)
    .limit(limit)
    .exec(),
  User.find(filter)
    .countDocuments()
    .exec(),
]);

return transformToDefaultGraphQLConnection\<
 String,
 DatabaseUser,
 DatabaseUser
\>({
 objectList,
 parsedArgs,
 totalCount,
});
```

## Defined in

[src/utilities/graphQLConnection/transformToDefaultGraphQLConnection.ts:53](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/graphQLConnection/transformToDefaultGraphQLConnection.ts#L53)
