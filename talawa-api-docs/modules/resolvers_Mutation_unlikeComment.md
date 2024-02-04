[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/unlikeComment

# Module: resolvers/Mutation/unlikeComment

## Table of contents

### Variables

- [unlikeComment](resolvers_Mutation_unlikeComment.md#unlikecomment)

## Variables

### unlikeComment

• `Const` **unlikeComment**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"unlikeComment"``]

This function enables to unlike a comment.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the comment exists

#### Defined in

[src/resolvers/Mutation/unlikeComment.ts:17](https://github.com/PalisadoesFoundation/talawa-api/blob/00da99c/src/resolvers/Mutation/unlikeComment.ts#L17)
