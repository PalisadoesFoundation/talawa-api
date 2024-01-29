[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createActionItemCategory

# Module: resolvers/Mutation/createActionItemCategory

## Table of contents

### Variables

- [createActionItemCategory](resolvers_Mutation_createActionItemCategory.md#createactionitemcategory)

## Variables

### createActionItemCategory

• `Const` **createActionItemCategory**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createActionItemCategory"``]

This function enables to create an ActionItemCategory.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the User exists
2. If the Organization exists
3. Is the User is Authorized
4. If the action item category already exists

#### Defined in

[src/resolvers/Mutation/createActionItemCategory.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/resolvers/Mutation/createActionItemCategory.ts#L27)
