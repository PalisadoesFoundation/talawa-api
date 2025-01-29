[Admin Docs](/)

***

# Class: TalawaGraphQLError

A custom class extended from the GraphQLError class to standardize the errors returned from talawa-api's
graphQL resolvers. This standardization prevents the talawa-api contributers from returning undocumented,
arbitrary errors to the client applications in the graphQL query responses. This standardization also helps
the client developers to know beforehand what kind of errors they can expect from talawa-api's graphQL
responses, helping them design better UI experiences for user feedback.

If necessary, the localization of the error messages(i18n) can be done within the graphQL resolvers where the
TalawaGraphQLError class is used.

This is the definition of a graphQL resolver for resolving the user record of the best friend of a user:-

## Example

```ts
export const bestFriend = async (parent) =\> {
 const user = await dbClient.query.user.findFirst({
     where(fields, operators) {
         return operators.eq(fields.id, parent.bestFriendId);
     }
 });

 if (user === undefined) {
     throw new TalawaGraphQLError("Best friend not found", {
         code: "RESOURCE_NOT_FOUND"
     })
 }

 return user;
}
```

## Extends

- `GraphQLError`

## Constructors

### new TalawaGraphQLError()

> **new TalawaGraphQLError**(`message`, `options`): [`TalawaGraphQLError`](TalawaGraphQLError.md)

#### Parameters

##### message

`string`

##### options

`GraphQLErrorOptions` & `object`

#### Returns

[`TalawaGraphQLError`](TalawaGraphQLError.md)

#### Overrides

`GraphQLError.constructor`

#### Defined in

[src/utilities/TalawaGraphQLError.ts:189](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/TalawaGraphQLError.ts#L189)
