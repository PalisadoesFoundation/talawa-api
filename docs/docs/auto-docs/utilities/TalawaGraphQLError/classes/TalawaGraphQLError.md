[API Docs](/)

***

# Class: TalawaGraphQLError

Defined in: [src/utilities/TalawaGraphQLError.ts:345](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L345)

Custom GraphQL error class that provides structured error handling with typed extensions.

This class extends the standard GraphQLError and enforces strict TypeScript typing
on error metadata within the `extensions` field. It prevents arbitrary, undocumented
errors from being returned to GraphQL clients and standardizes error responses.

The class integrates with the unified error handling system by supporting ErrorCode
enum values and providing consistent error shapes across REST and GraphQL endpoints.

## Example

```ts
// Basic authentication error
throw new TalawaGraphQLError({
  extensions: {
    code: ErrorCode.UNAUTHENTICATED
  }
});

// Error with details and custom message
throw new TalawaGraphQLError({
  message: "Organization not found",
  extensions: {
    code: ErrorCode.NOT_FOUND,
    details: { organizationId: "123" }
  }
});

// Legacy typed extension (for backward compatibility)
throw new TalawaGraphQLError({
  extensions: {
    code: "arguments_associated_resources_not_found",
    issues: [
      { argumentPath: ["input", "id"] }
    ]
  }
});
```

The following example shows usage within a GraphQL resolver:
```ts
export const user = async (parent, args, ctx) => {
  const existingUser = await ctx.drizzleClient.query.user.findFirst({
    where: (fields, operators) => operators.eq(fields.id, args.input.id),
  });

  if (user === undefined) {
    throw new TalawaGraphQLError({
      extensions: {
        code: ErrorCode.NOT_FOUND,
        details: { userId: args.input.id }
      }
    });
  }

  return user;
}
```

## Extends

- `GraphQLError`

## Constructors

### Constructor

> **new TalawaGraphQLError**(`options`): `TalawaGraphQLError`

Defined in: [src/utilities/TalawaGraphQLError.ts:356](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L356)

Creates a new TalawaGraphQLError instance.

#### Parameters

##### options

`GraphQLErrorOptions` & `object`

Error configuration object

#### Returns

`TalawaGraphQLError`

#### Overrides

`GraphQLError.constructor`
