[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/unblockUser

# Module: resolvers/Mutation/unblockUser

## Table of contents

### Variables

- [unblockUser](resolvers_Mutation_unblockUser.md#unblockuser)

## Variables

### unblockUser

• `Const` **unblockUser**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"unblockUser"``]

This function enables to unblock user.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists.
2. If the user exists
3. If the user is an admin of the organization

#### Defined in

[src/resolvers/Mutation/unblockUser.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/3a8a11a/src/resolvers/Mutation/unblockUser.ts#L25)
