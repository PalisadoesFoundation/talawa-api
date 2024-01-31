[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/blockUser

# Module: resolvers/Mutation/blockUser

## Table of contents

### Variables

- [blockUser](resolvers_Mutation_blockUser.md#blockuser)

## Variables

### blockUser

• `Const` **blockUser**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"blockUser"``]

This function enables blocking a user.

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
3. If the user is an admin of organization
4. If the user to be blocked is already blocked by the organization

#### Defined in

[src/resolvers/Mutation/blockUser.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/73679e2/src/resolvers/Mutation/blockUser.ts#L27)
