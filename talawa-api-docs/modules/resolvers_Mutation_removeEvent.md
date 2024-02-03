[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeEvent

# Module: resolvers/Mutation/removeEvent

## Table of contents

### Variables

- [removeEvent](resolvers_Mutation_removeEvent.md#removeevent)

## Variables

### removeEvent

• `Const` **removeEvent**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeEvent"``]

This function enables to remove an event.

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
3. If the user is an admin of the organization.
4. If the user is an admin of the event.

#### Defined in

[src/resolvers/Mutation/removeEvent.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Mutation/removeEvent.ts#L24)
