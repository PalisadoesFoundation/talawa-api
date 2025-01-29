[**talawa-api**](../../../../README.md)

***

# Function: users()

> **users**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

Resolver function for the `users` field of an `AgendaItem`.

This function retrieves the users associated with a specific agenda item.

## Parameters

### parent

[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)

The parent object representing the agenda item. It contains information about the agenda item, including the IDs of the users associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

A promise that resolves to the user documents found in the database. These documents represent the users associated with the agenda item.

## See

 - User - The User model used to interact with the users collection in the database.
 - AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.

## Defined in

[src/resolvers/AgendaItem/Users.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/AgendaItem/Users.ts#L16)
