[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/adminRemoveEvent

# Module: resolvers/Mutation/adminRemoveEvent

## Table of contents

### Variables

- [adminRemoveEvent](resolvers_Mutation_adminRemoveEvent.md#adminremoveevent)

## Variables

### adminRemoveEvent

• `Const` **adminRemoveEvent**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"adminRemoveEvent"``]

This function enables an admin to remove a event

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the event exists
2. If the organization exists
3. If the user exists
4. If the user is an admin of organization

#### Defined in

[src/resolvers/Mutation/adminRemoveEvent.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/e7d3a46/src/resolvers/Mutation/adminRemoveEvent.ts#L27)
