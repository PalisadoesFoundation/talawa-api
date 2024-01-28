[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createMember

# Module: resolvers/Mutation/createMember

## Table of contents

### Variables

- [createMember](resolvers_Mutation_createMember.md#createmember)

## Variables

### createMember

• `Const` **createMember**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createMember"``]

This function enables to add a member.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. Checks whether current user making the request is an superAdmin
2. If the organization exists
3. Checks whether curent user exists.
4. Checks whether user with _id === args.input.userId is already an member of organization..

#### Defined in

[src/resolvers/Mutation/createMember.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/ac416c4/src/resolvers/Mutation/createMember.ts#L24)
