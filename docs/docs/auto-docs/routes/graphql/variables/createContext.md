[API Docs](/)

***

# Variable: createContext

> `const` **createContext**: [`CreateContext`](../type-aliases/CreateContext.md)

Defined in: [src/routes/graphql.ts:136](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/graphql.ts#L136)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.
