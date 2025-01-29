[**talawa-api**](../../../../README.md)

***

# Function: categories()

> **categories**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[]\>

Resolver function for the `categories` field of an `AgendaItem`.

This function retrieves the categories associated with a specific agenda item.

## Parameters

### parent

[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)

The parent object representing the agenda item. It contains a list of category IDs associated with it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)\>[]\>

A promise that resolves to an array of category documents found in the database. These documents represent the categories associated with the agenda item.

## See

 - AgendaCategoryModel - The model used to interact with the categories collection in the database.
 - AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.

## Defined in

[src/resolvers/AgendaItem/categories.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/AgendaItem/categories.ts#L17)
