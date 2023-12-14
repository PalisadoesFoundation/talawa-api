[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/updateTask

# Module: resolvers/Mutation/updateTask

## Table of contents

### Variables

- [updateTask](resolvers_Mutation_updateTask.md#updatetask)

## Variables

### updateTask

• `Const` **updateTask**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"updateTask"``]

This function enables to update a task.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the task exists.

#### Defined in

[src/resolvers/Mutation/updateTask.ts:19](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/updateTask.ts#L19)
