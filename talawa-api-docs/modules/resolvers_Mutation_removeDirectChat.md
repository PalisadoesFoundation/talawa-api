[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeDirectChat

# Module: resolvers/Mutation/removeDirectChat

## Table of contents

### Variables

- [removeDirectChat](resolvers_Mutation_removeDirectChat.md#removedirectchat)

## Variables

### removeDirectChat

• `Const` **removeDirectChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeDirectChat"``]

This function enables to remove direct chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists
2. If the chat exists
3. If the user is an admin of the organization.

#### Defined in

[src/resolvers/Mutation/removeDirectChat.ts:22](https://github.com/PalisadoesFoundation/talawa-api/blob/c199cfb/src/resolvers/Mutation/removeDirectChat.ts#L22)
