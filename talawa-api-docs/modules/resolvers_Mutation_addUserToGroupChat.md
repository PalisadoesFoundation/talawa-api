[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/addUserToGroupChat

# Module: resolvers/Mutation/addUserToGroupChat

## Table of contents

### Variables

- [addUserToGroupChat](resolvers_Mutation_addUserToGroupChat.md#addusertogroupchat)

## Variables

### addUserToGroupChat

• `Const` **addUserToGroupChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"addUserToGroupChat"``]

This function adds user to group chat.

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
3. If the user trying to add the user is an admin of organization
4. If the user exists
5. If the user is already a member of the chat

#### Defined in

[src/resolvers/Mutation/addUserToGroupChat.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/resolvers/Mutation/addUserToGroupChat.ts#L27)
