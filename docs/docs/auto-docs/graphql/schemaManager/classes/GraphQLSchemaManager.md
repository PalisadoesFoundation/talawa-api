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

Defined in: [src/graphql/schemaManager.ts:60](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L60)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema` \| `null`

Defined in: [src/graphql/schemaManager.ts:283](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L283)

Get the current schema

#### Returns

`GraphQLSchema` \| `null`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:254](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L254)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:80](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L80)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:261](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L261)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### setLogger()

> **setLogger**(`logger`): `void`

Defined in: [src/graphql/schemaManager.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/schemaManager.ts#L32)

Set a custom logger for the schema manager

#### Parameters

##### logger

###### error

(`msg`, `error?`) => `void`

###### info

(`msg`) => `void`

#### Returns

`void`
