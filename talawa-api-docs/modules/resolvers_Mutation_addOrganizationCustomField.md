[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/addOrganizationCustomField

# Module: resolvers/Mutation/addOrganizationCustomField

## Table of contents

### Variables

- [addOrganizationCustomField](resolvers_Mutation_addOrganizationCustomField.md#addorganizationcustomfield)

## Variables

### addOrganizationCustomField

• `Const` **addOrganizationCustomField**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"addOrganizationCustomField"``]

This function enables an admin to add an organization colleciton field.

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
4. If the required name and value was provided for the new custom field

#### Defined in

[src/resolvers/Mutation/addOrganizationCustomField.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/resolvers/Mutation/addOrganizationCustomField.ts#L25)
