[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/unregisterForEventByUser

# Module: resolvers/Mutation/unregisterForEventByUser

## Table of contents

### Variables

- [unregisterForEventByUser](resolvers_Mutation_unregisterForEventByUser.md#unregisterforeventbyuser)

## Variables

### unregisterForEventByUser

• `Const` **unregisterForEventByUser**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"unregisterForEventByUser"``]

This function enables a user to unregister from an event.

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
3. If the user is a registrant of the event.

#### Defined in

[src/resolvers/Mutation/unregisterForEventByUser.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/fcc2f8f/src/resolvers/Mutation/unregisterForEventByUser.ts#L24)
