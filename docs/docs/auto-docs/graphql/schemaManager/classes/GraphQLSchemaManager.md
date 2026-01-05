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

Defined in: [src/graphql/schemaManager.ts:104](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L104)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: [src/graphql/schemaManager.ts:327](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L327)

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:298](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L298)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:124](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L124)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:305](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L305)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### setLogger()

> **setLogger**(`logger`): `void`

Defined in: [src/graphql/schemaManager.ts:76](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L76)

Set a custom logger for the schema manager

#### Parameters

##### logger

###### error

(`msg`, `error?`) => `void`

###### info

(`msg`) => `void`

#### Returns

`void`
