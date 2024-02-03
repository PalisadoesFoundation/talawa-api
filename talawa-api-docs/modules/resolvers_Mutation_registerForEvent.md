[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/registerForEvent

# Module: resolvers/Mutation/registerForEvent

## Table of contents

### Variables

- [registerForEvent](resolvers_Mutation_registerForEvent.md#registerforevent)

## Variables

### registerForEvent

• `Const` **registerForEvent**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"registerForEvent"``]

This function enables to register for event.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the event exists.
2. If the user has already registered for the event

#### Defined in

[src/resolvers/Mutation/registerForEvent.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/resolvers/Mutation/registerForEvent.ts#L24)
