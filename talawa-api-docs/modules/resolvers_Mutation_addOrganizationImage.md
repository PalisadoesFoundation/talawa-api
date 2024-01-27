[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/addOrganizationImage

# Module: resolvers/Mutation/addOrganizationImage

## Table of contents

### Variables

- [addOrganizationImage](resolvers_Mutation_addOrganizationImage.md#addorganizationimage)

## Variables

### addOrganizationImage

• `Const` **addOrganizationImage**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"addOrganizationImage"``]

This function adds Organization Image.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the current user exists
2. If the organization exists
3. If the user trying to add the image is an admin of organization

#### Defined in

[src/resolvers/Mutation/addOrganizationImage.ts:21](https://github.com/PalisadoesFoundation/talawa-api/blob/fcc2f8f/src/resolvers/Mutation/addOrganizationImage.ts#L21)
