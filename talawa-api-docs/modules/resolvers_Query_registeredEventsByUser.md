[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/registeredEventsByUser

# Module: resolvers/Query/registeredEventsByUser

## Table of contents

### Variables

- [registeredEventsByUser](resolvers_Query_registeredEventsByUser.md#registeredeventsbyuser)

## Variables

### registeredEventsByUser

• `Const` **registeredEventsByUser**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"registeredEventsByUser"``]

This query will fetch all the events for which user registered from the database.

**`Param`**

**`Param`**

An object that contains `id` of the user and `orderBy`.

**`Remarks`**

The query function uses `getSort()` function to sort the data in specified.

#### Defined in

[src/resolvers/Query/registeredEventsByUser.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/c199cfb/src/resolvers/Query/registeredEventsByUser.ts#L12)
