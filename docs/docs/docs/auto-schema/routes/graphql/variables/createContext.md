[Admin Docs](/)

***

# Variable: createContext

> `const` **createContext**: [`CreateContext`](../type-aliases/CreateContext.md)

Defined in: [src/routes/graphql.ts:53](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/routes/graphql.ts#L53)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.
