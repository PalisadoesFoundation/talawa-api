[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createPost

# Module: resolvers/Mutation/createPost

## Table of contents

### Variables

- [createPost](resolvers_Mutation_createPost.md#createpost)

## Variables

### createPost

• `Const` **createPost**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createPost"``]

This function enables to create a post.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the organization exists

#### Defined in

[src/resolvers/Mutation/createPost.ts:28](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Mutation/createPost.ts#L28)
