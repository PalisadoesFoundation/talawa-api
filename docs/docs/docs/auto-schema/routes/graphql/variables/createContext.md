[Admin Docs](/)

***

# Variable: createContext

> `const` **createContext**: [`CreateContext`](../type-aliases/CreateContext.md)

Defined in: [src/routes/graphql.ts:53](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/routes/graphql.ts#L53)

This function is used to create the explicit context passed to the graphql resolvers each time they resolve a graphql operation at runtime. All the transport protocol specific information should be dealt with within this function and the return type of this function must be transport protocol agnostic.
