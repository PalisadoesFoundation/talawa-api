[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/updateEvent

# Module: resolvers/Mutation/updateEvent

## Table of contents

### Variables

- [updateEvent](resolvers_Mutation_updateEvent.md#updateevent)

## Variables

### updateEvent

• `Const` **updateEvent**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"updateEvent"``]

This function enables to update an event.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the event exists.
3. The the user is an admin of the event.

#### Defined in

[src/resolvers/Mutation/updateEvent.ts:26](https://github.com/PalisadoesFoundation/talawa-api/blob/00da99c/src/resolvers/Mutation/updateEvent.ts#L26)
