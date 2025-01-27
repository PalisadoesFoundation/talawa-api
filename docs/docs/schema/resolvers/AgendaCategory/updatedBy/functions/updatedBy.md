[**talawa-api**](../../../../README.md)

***

# Function: updatedBy()

> **updatedBy**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Resolver function for the `updatedBy` field of an `AgendaCategory`.

This function retrieves the user who last updated a specific agenda category.

## Parameters

### parent

[`InterfaceAgendaCategory`](../../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)

The parent object representing the agenda category. It contains information about the agenda category, including the ID of the user who last updated it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

A promise that resolves to the user document found in the database. This document represents the user who last updated the agenda category.

## See

 - User - The User model used to interact with the users collection in the database.
 - AgendaCategoryResolvers - The type definition for the resolvers of the AgendaCategory fields.

```typescript
return User.findOne({ _id: parent.updatedBy }).lean();
```

## Defined in

[src/resolvers/AgendaCategory/updatedBy.ts:19](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/AgendaCategory/updatedBy.ts#L19)
