[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeComment

# Module: resolvers/Mutation/removeComment

## Table of contents

### Variables

- [removeComment](resolvers_Mutation_removeComment.md#removecomment)

## Variables

### removeComment

• `Const` **removeComment**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeComment"``]

This function enables to remove a comment.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the comment exists.
3. If the user is the creator of the organization.

#### Defined in

[src/resolvers/Mutation/removeComment.ts:26](https://github.com/PalisadoesFoundation/talawa-api/blob/de4debc/src/resolvers/Mutation/removeComment.ts#L26)
