[**talawa-api**](../../../../README.md)

***

# Function: users()

> **users**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

Resolver function for the `users` field of a `UserFamily`.

This function retrieves the users who are part of a specific user family.

## Parameters

### parent

[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)

The parent object representing the user family. It contains information about the user family, including the IDs of the users who are part of it.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>[]\>

A promise that resolves to an array of user documents found in the database. These documents represent the users who are part of the user family.

## See

 - User - The User model used to interact with the users collection in the database.
 - UserFamilyResolvers - The type definition for the resolvers of the UserFamily fields.

## Defined in

[src/resolvers/UserFamily/users.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/UserFamily/users.ts#L16)
