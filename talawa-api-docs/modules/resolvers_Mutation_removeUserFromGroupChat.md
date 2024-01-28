[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeUserFromGroupChat

# Module: resolvers/Mutation/removeUserFromGroupChat

## Table of contents

### Variables

- [removeUserFromGroupChat](resolvers_Mutation_removeUserFromGroupChat.md#removeuserfromgroupchat)

## Variables

### removeUserFromGroupChat

• `Const` **removeUserFromGroupChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeUserFromGroupChat"``]

This function enables to remove a user from group chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the group chat exists.
2. If the organization exists
3. If the user is the admin of the organization.
4. If the user to be removed is a member of the organization.

#### Defined in

[src/resolvers/Mutation/removeUserFromGroupChat.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/ac416c4/src/resolvers/Mutation/removeUserFromGroupChat.ts#L24)
