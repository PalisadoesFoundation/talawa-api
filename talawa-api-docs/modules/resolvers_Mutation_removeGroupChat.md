[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeGroupChat

# Module: resolvers/Mutation/removeGroupChat

## Table of contents

### Variables

- [removeGroupChat](resolvers_Mutation_removeGroupChat.md#removegroupchat)

## Variables

### removeGroupChat

• `Const` **removeGroupChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeGroupChat"``]

This function enables to remove an graoup chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the group chat exists
2. If the organization exists
3. If the user is an admin of the organization.

#### Defined in

[src/resolvers/Mutation/removeGroupChat.ts:22](https://github.com/PalisadoesFoundation/talawa-api/blob/515781e/src/resolvers/Mutation/removeGroupChat.ts#L22)
