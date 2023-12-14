[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeEventProject

# Module: resolvers/Mutation/removeEventProject

## Table of contents

### Variables

- [removeEventProject](resolvers_Mutation_removeEventProject.md#removeeventproject)

## Variables

### removeEventProject

• `Const` **removeEventProject**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeEventProject"``]

This function enables to remove an event project.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the event project exists
3. If the user is the creator of the event project.

#### Defined in

[src/resolvers/Mutation/removeEventProject.ts:23](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/removeEventProject.ts#L23)
