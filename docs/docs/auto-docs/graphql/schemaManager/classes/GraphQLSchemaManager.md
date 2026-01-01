[API Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: [src/graphql/schemaManager.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L16)

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L50)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: [src/graphql/schemaManager.ts:272](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L272)

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:243](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L243)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L70)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:250](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L250)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### setLogger()

> **setLogger**(`logger`): `void`

Defined in: [src/graphql/schemaManager.ts:25](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L25)

Set the logger instance

#### Parameters

##### logger

`FastifyBaseLogger`

#### Returns

`void`
