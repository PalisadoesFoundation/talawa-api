[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeMember

# Module: resolvers/Mutation/removeMember

## Table of contents

### Variables

- [removeMember](resolvers_Mutation_removeMember.md#removemember)

## Variables

### removeMember

• `Const` **removeMember**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeMember"``]

This function enables to remove a member.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists
2. If the user to be removed exists.
3. If the user is the admin of the organization.
4. If the user to be removed is a member of the organization.

#### Defined in

[src/resolvers/Mutation/removeMember.ts:29](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/resolvers/Mutation/removeMember.ts#L29)
