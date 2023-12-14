[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/sendMessageToDirectChat

# Module: resolvers/Mutation/sendMessageToDirectChat

## Table of contents

### Variables

- [sendMessageToDirectChat](resolvers_Mutation_sendMessageToDirectChat.md#sendmessagetodirectchat)

## Variables

### sendMessageToDirectChat

• `Const` **sendMessageToDirectChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"sendMessageToDirectChat"``]

This function enables to send message to direct chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the direct chat exists.
2. If the user exists

#### Defined in

[src/resolvers/Mutation/sendMessageToDirectChat.ts:15](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/sendMessageToDirectChat.ts#L15)
