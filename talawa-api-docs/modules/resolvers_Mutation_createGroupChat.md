[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createGroupChat

# Module: resolvers/Mutation/createGroupChat

## Table of contents

### Variables

- [createGroupChat](resolvers_Mutation_createGroupChat.md#creategroupchat)

## Variables

### createGroupChat

• `Const` **createGroupChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createGroupChat"``]

This function enables to create a group chat.

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

[src/resolvers/Mutation/createGroupChat.ts:20](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/resolvers/Mutation/createGroupChat.ts#L20)
