[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/updateOrganization

# Module: resolvers/Mutation/updateOrganization

## Table of contents

### Variables

- [updateOrganization](resolvers_Mutation_updateOrganization.md#updateorganization)

## Variables

### updateOrganization

• `Const` **updateOrganization**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"updateOrganization"``]

This function enables to update an organization.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists.
2. The the user is an admin of the organization.

#### Defined in

[src/resolvers/Mutation/updateOrganization.ts:21](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/updateOrganization.ts#L21)
