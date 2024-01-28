[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeOrganizationCustomField

# Module: resolvers/Mutation/removeOrganizationCustomField

## Table of contents

### Variables

- [removeOrganizationCustomField](resolvers_Mutation_removeOrganizationCustomField.md#removeorganizationcustomfield)

## Variables

### removeOrganizationCustomField

• `Const` **removeOrganizationCustomField**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeOrganizationCustomField"``]

This function enables an admin to remove an organization colleciton field.

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
3. If the user is an admin for the organization.
4. If the custom field to be removed exists

#### Defined in

[src/resolvers/Mutation/removeOrganizationCustomField.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/0075fca/src/resolvers/Mutation/removeOrganizationCustomField.ts#L24)
