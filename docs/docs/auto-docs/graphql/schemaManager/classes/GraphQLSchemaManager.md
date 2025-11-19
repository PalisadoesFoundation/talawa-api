[API Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: src/graphql/schemaManager.ts:15

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: src/graphql/schemaManager.ts:41

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: src/graphql/schemaManager.ts:255

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: src/graphql/schemaManager.ts:226

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: src/graphql/schemaManager.ts:61

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: src/graphql/schemaManager.ts:233

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`
