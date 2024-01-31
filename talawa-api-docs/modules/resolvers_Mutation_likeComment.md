[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/likeComment

# Module: resolvers/Mutation/likeComment

## Table of contents

### Variables

- [likeComment](resolvers_Mutation_likeComment.md#likecomment)

## Variables

### likeComment

• `Const` **likeComment**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"likeComment"``]

This function enables to like a post.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the post exists
3. If the user has already liked the post.

#### Defined in

[src/resolvers/Mutation/likeComment.ts:18](https://github.com/PalisadoesFoundation/talawa-api/blob/e7d3a46/src/resolvers/Mutation/likeComment.ts#L18)
