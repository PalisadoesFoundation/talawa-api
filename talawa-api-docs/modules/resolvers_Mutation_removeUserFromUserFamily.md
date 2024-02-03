[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeUserFromUserFamily

# Module: resolvers/Mutation/removeUserFromUserFamily

## Table of contents

### Variables

- [removeUserFromUserFamily](resolvers_Mutation_removeUserFromUserFamily.md#removeuserfromuserfamily)

## Variables

### removeUserFromUserFamily

• `Const` **removeUserFromUserFamily**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeUserFromUserFamily"``]

This function enables to remove a user from group chat.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire publication

**`Remarks`**

The following checks are done:
1. If the family exists.
2. If the user to be removed is member of the organisation.
3. If the user is admin of the family

#### Defined in

[src/resolvers/Mutation/removeUserFromUserFamily.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/b1dd6c9/src/resolvers/Mutation/removeUserFromUserFamily.ts#L25)
