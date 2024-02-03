[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/likePost

# Module: resolvers/Mutation/likePost

## Table of contents

### Variables

- [likePost](resolvers_Mutation_likePost.md#likepost)

## Variables

### likePost

• `Const` **likePost**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"likePost"``]

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

[src/resolvers/Mutation/likePost.ts:18](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/resolvers/Mutation/likePost.ts#L18)
