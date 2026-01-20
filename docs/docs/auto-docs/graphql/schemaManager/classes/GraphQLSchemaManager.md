[API Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: src/graphql/schemaManager.ts:16

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: src/graphql/schemaManager.ts:42

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: src/graphql/schemaManager.ts:266

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: src/graphql/schemaManager.ts:237

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: src/graphql/schemaManager.ts:62

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: src/graphql/schemaManager.ts:244

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`
