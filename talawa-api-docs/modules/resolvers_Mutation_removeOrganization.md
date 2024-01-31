[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeOrganization

# Module: resolvers/Mutation/removeOrganization

## Table of contents

### Variables

- [removeOrganization](resolvers_Mutation_removeOrganization.md#removeorganization)

## Variables

### removeOrganization

• `Const` **removeOrganization**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeOrganization"``]

This function enables to remove an organization.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the organization exists
3. If the user is the creator of the organization.

#### Defined in

[src/resolvers/Mutation/removeOrganization.ts:32](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Mutation/removeOrganization.ts#L32)
