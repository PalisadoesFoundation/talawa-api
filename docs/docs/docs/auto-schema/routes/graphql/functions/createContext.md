[Admin Docs](/)

***

# Function: createContext()

> **createContext**(`initialContext`): `Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>

Defined in: [src/routes/graphql.ts:50](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/routes/graphql.ts#L50)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.

## Parameters

### initialContext

`InitialContext`

## Returns

`Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>
