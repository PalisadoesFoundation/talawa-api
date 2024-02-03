[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/unlikePost

# Module: resolvers/Mutation/unlikePost

## Table of contents

### Variables

- [unlikePost](resolvers_Mutation_unlikePost.md#unlikepost)

## Variables

### unlikePost

• `Const` **unlikePost**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"unlikePost"``]

This function enables to unlike a post.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the post exists

#### Defined in

[src/resolvers/Mutation/unlikePost.ts:18](https://github.com/PalisadoesFoundation/talawa-api/blob/b1dd6c9/src/resolvers/Mutation/unlikePost.ts#L18)
