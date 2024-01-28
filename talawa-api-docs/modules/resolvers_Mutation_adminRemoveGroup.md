[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/adminRemoveGroup

# Module: resolvers/Mutation/adminRemoveGroup

## Table of contents

### Variables

- [adminRemoveGroup](resolvers_Mutation_adminRemoveGroup.md#adminremovegroup)

## Variables

### adminRemoveGroup

• `Const` **adminRemoveGroup**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"adminRemoveGroup"``]

This function enables an admin to remove a group.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the group chat exists
2. If the organization exists
3. If the user exists
4. If the user is an admin of organization

#### Defined in

[src/resolvers/Mutation/adminRemoveGroup.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/ac416c4/src/resolvers/Mutation/adminRemoveGroup.ts#L25)
