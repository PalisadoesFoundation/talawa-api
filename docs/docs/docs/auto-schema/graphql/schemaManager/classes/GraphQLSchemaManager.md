[Admin Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: [src/graphql/schemaManager.ts:13](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L13)

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:64](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L64)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `GraphQLSchema`

Defined in: [src/graphql/schemaManager.ts:472](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L472)

Get the current schema

#### Returns

`GraphQLSchema`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:441](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L441)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:99](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L99)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:448](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/schemaManager.ts#L448)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`
