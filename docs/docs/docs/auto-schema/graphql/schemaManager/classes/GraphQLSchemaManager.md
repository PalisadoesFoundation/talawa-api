[Admin Docs](/)

***

# Class: GraphQLSchemaManager

Defined in: [src/graphql/schemaManager.ts:15](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L15)

## Constructors

### Constructor

> **new GraphQLSchemaManager**(): `GraphQLSchemaManager`

#### Returns

`GraphQLSchemaManager`

## Methods

### buildInitialSchema()

> **buildInitialSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:41](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L41)

Build the initial schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### getCurrentSchema()

> **getCurrentSchema**(): `null` \| `GraphQLSchema`

Defined in: [src/graphql/schemaManager.ts:255](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L255)

Get the current schema

#### Returns

`null` \| `GraphQLSchema`

***

### onSchemaUpdate()

> **onSchemaUpdate**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:226](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L226)

Register a callback to be notified when the schema is updated

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`

***

### rebuildSchema()

> **rebuildSchema**(): `Promise`\<`GraphQLSchema`\>

Defined in: [src/graphql/schemaManager.ts:61](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L61)

Dynamically rebuild the GraphQL schema

#### Returns

`Promise`\<`GraphQLSchema`\>

***

### removeSchemaUpdateCallback()

> **removeSchemaUpdateCallback**(`callback`): `void`

Defined in: [src/graphql/schemaManager.ts:233](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/schemaManager.ts#L233)

Remove a schema update callback

#### Parameters

##### callback

(`schema`) => `void`

#### Returns

`void`
