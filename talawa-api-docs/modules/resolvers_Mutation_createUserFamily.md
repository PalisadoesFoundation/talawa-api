[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createUserFamily

# Module: resolvers/Mutation/createUserFamily

## Table of contents

### Variables

- [createUserFamily](resolvers_Mutation_createUserFamily.md#createuserfamily)

## Variables

### createUserFamily

• `Const` **createUserFamily**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createUserFamily"``]

This Function enables to create a user Family

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

- The following checks are done:
1. If the user exists
2. If the user is super admin
3. If there are atleast two members in the family.

#### Defined in

[src/resolvers/Mutation/createUserFamily.ts:23](https://github.com/PalisadoesFoundation/talawa-api/blob/8707a9c/src/resolvers/Mutation/createUserFamily.ts#L23)
