[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeOrganizationImage

# Module: resolvers/Mutation/removeOrganizationImage

## Table of contents

### Variables

- [removeOrganizationImage](resolvers_Mutation_removeOrganizationImage.md#removeorganizationimage)

## Variables

### removeOrganizationImage

• `Const` **removeOrganizationImage**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeOrganizationImage"``]

This function enables to remove an organization's image.

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
3. If the user is the admin of the organization.

#### Defined in

[src/resolvers/Mutation/removeOrganizationImage.ts:22](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Mutation/removeOrganizationImage.ts#L22)
