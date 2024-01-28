[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/leaveOrganization

# Module: resolvers/Mutation/leaveOrganization

## Table of contents

### Variables

- [leaveOrganization](resolvers_Mutation_leaveOrganization.md#leaveorganization)

## Variables

### leaveOrganization

• `Const` **leaveOrganization**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"leaveOrganization"``]

This function enables to leave an organization.

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
3. If the user is the creator of the organization
4. If the user is a member of the organization

#### Defined in

[src/resolvers/Mutation/leaveOrganization.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/0075fca/src/resolvers/Mutation/leaveOrganization.ts#L24)
