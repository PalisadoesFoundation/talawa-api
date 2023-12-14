[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createTask

# Module: resolvers/Mutation/createTask

## Table of contents

### Variables

- [createTask](resolvers_Mutation_createTask.md#createtask)

## Variables

### createTask

• `Const` **createTask**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createTask"``]

This function enables to create a task.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the event exists

#### Defined in

[src/resolvers/Mutation/createTask.ts:20](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/createTask.ts#L20)
