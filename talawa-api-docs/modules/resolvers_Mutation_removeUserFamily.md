[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeUserFamily

# Module: resolvers/Mutation/removeUserFamily

## Table of contents

### Variables

- [removeUserFamily](resolvers_Mutation_removeUserFamily.md#removeuserfamily)

## Variables

### removeUserFamily

• `Const` **removeUserFamily**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeUserFamily"``]

This function enables to remove a user family.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Context`**

The following checks are done:
1. If the user family exists
2. If the user is super admin.

#### Defined in

[src/resolvers/Mutation/removeUserFamily.ts:19](https://github.com/PalisadoesFoundation/talawa-api/blob/b1dd6c9/src/resolvers/Mutation/removeUserFamily.ts#L19)
