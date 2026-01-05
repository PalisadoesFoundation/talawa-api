[API Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: [src/graphql/schemaManager.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L17)

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L63)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: [src/graphql/schemaManager.ts:286](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L286)

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:257](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L257)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:83](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L83)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:264](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L264)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### setLogger()

> **setLogger**(`logger`): `void`

Defined in: [src/graphql/schemaManager.ts:35](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L35)

Set a custom logger for the schema manager

#### Parameters

##### logger

###### error

(`msg`, `error?`) => `void`

###### info

(`msg`) => `void`

#### Returns

`void`
