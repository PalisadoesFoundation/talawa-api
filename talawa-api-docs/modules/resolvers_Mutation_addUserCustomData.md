[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/addUserCustomData

# Module: resolvers/Mutation/addUserCustomData

## Table of contents

### Variables

- [addUserCustomData](resolvers_Mutation_addUserCustomData.md#addusercustomdata)

## Variables

### addUserCustomData

• `Const` **addUserCustomData**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"addUserCustomData"``]

This function enables a user to add data for a custom field for a joined organization.

**`Param`**

parent of the current request

**`Param`**

payload provided with the request

**`Param`**

context of the entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the organization exists.

#### Defined in

[src/resolvers/Mutation/addUserCustomData.ts:20](https://github.com/PalisadoesFoundation/talawa-api/blob/c199cfb/src/resolvers/Mutation/addUserCustomData.ts#L20)
