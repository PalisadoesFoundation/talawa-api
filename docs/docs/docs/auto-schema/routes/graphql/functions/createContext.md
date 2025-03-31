[Admin Docs](/)

***

# Function: createContext()

> **createContext**(`initialContext`): `Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>

Defined in: [src/routes/graphql.ts:50](https://github.com/PurnenduMIshra129th/talawa-api/blob/8bb4483f6aa0d175e00d3d589e36182f9c58a66a/src/routes/graphql.ts#L50)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.

## Parameters

### initialContext

`InitialContext`

## Returns

`Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>
