[**talawa-api**](../../../../README.md)

***

# Function: default()

> **default**(`schema`, `directiveName`): `GraphQLSchema`

A function to transform a GraphQL schema by adding role-based authorization
logic to the fields with the specified directive.

## Parameters

### schema

`GraphQLSchema`

The original GraphQL schema to be transformed.

### directiveName

`string`

The name of the directive that will trigger the transformation.

## Returns

`GraphQLSchema`

A new GraphQL schema with the role-based authorization logic applied.

## See

Parent File:
- `src/index.ts`

## Example

```ts
const transformedSchema = roleDirectiveTransformer(originalSchema, 'role');
```

## Defined in

[src/directives/directiveTransformer/roleDirectiveTransformer.ts:24](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/directives/directiveTransformer/roleDirectiveTransformer.ts#L24)
