[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createEventProject

# Module: resolvers/Mutation/createEventProject

## Table of contents

### Variables

- [createEventProject](resolvers_Mutation_createEventProject.md#createeventproject)

## Variables

### createEventProject

• `Const` **createEventProject**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createEventProject"``]

This function enables to create an event project.

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
3. If the user is an admin of the event.

#### Defined in

[src/resolvers/Mutation/createEventProject.ts:26](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/createEventProject.ts#L26)
