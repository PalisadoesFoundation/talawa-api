[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeTask

# Module: resolvers/Mutation/removeTask

## Table of contents

### Variables

- [removeTask](resolvers_Mutation_removeTask.md#removetask)

## Variables

### removeTask

• `Const` **removeTask**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeTask"``]

This function enables to remove a task.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the task exists
3. If the user is the creator of the task.

#### Defined in

[src/resolvers/Mutation/removeTask.ts:20](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/removeTask.ts#L20)
