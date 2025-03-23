[Admin Docs](/)

***

# Function: createContext()

> **createContext**(`initialContext`): `Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>

Defined in: [src/routes/graphql.ts:53](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/routes/graphql.ts#L53)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.

## Parameters

### initialContext

`InitialContext`

## Returns

`Promise`\<[`ExplicitGraphQLContext`](../../../graphql/context/type-aliases/ExplicitGraphQLContext.md)\>
