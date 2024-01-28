[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeAdmin

# Module: resolvers/Mutation/removeAdmin

## Table of contents

### Variables

- [removeAdmin](resolvers_Mutation_removeAdmin.md#removeadmin)

## Variables

### removeAdmin

• `Const` **removeAdmin**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeAdmin"``]

This function enables to remove an admin.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the organization exists.
3. If the user to be removed is an admin.
4. If the user removing the admin is the creator of the organization

#### Defined in

[src/resolvers/Mutation/removeAdmin.ts:26](https://github.com/PalisadoesFoundation/talawa-api/blob/de4debc/src/resolvers/Mutation/removeAdmin.ts#L26)
