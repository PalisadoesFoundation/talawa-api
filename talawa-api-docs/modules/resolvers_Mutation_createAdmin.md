[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createAdmin

# Module: resolvers/Mutation/createAdmin

## Table of contents

### Variables

- [createAdmin](resolvers_Mutation_createAdmin.md#createadmin)

## Variables

### createAdmin

• `Const` **createAdmin**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createAdmin"``]

This function enables to create an admin for an organization.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists
2. If the current user is the creator of the organization
3. If the user exists
4. If the user is a member of the organization
4. If the user is already an admin of the organization

#### Defined in

[src/resolvers/Mutation/createAdmin.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/00da99c/src/resolvers/Mutation/createAdmin.ts#L27)
