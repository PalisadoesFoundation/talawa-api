[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createDirectChat

# Module: resolvers/Mutation/createDirectChat

## Table of contents

### Variables

- [createDirectChat](resolvers_Mutation_createDirectChat.md#createdirectchat)

## Variables

### createDirectChat

• `Const` **createDirectChat**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createDirectChat"``]

This function enables to create direct chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists
2. If the user exists

#### Defined in

[src/resolvers/Mutation/createDirectChat.ts:20](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Mutation/createDirectChat.ts#L20)
