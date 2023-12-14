[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createEvent

# Module: resolvers/Mutation/createEvent

## Table of contents

### Variables

- [createEvent](resolvers_Mutation_createEvent.md#createevent)

## Variables

### createEvent

• `Const` **createEvent**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createEvent"``]

This function enables to create an event.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the organization exists
3. If the user is a part of the organization.

#### Defined in

[src/resolvers/Mutation/createEvent.ts:33](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/createEvent.ts#L33)
