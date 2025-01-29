[**talawa-api**](../../../README.md)

***

# Function: createLoggingMiddleware()

> **createLoggingMiddleware**\<`T`\>(`schema`, `modelName`): `void`

Creates a logging middleware for a Mongoose schema. This middleware logs
create, update, and delete operations on the specified schema.

## Type Parameters

• **T** *extends* `Document`

## Parameters

### schema

`Schema`\<`T`, `Model`\<`T`, `IfAny`\<`T`, `any`, `Document`\<`unknown`, `T`\> & `Require_id`\<`T`\>\>\>, `ObtainDocumentType`\<`any`, `T`, `ResolveSchemaOptions`\<`DefaultSchemaOptions`\>\>, `IfAny`\<`FlatRecord`\<`ObtainDocumentType`\<`any`, `T`, `ResolveSchemaOptions`\<`DefaultSchemaOptions`\>\>\>, `any`, `Document`\<`unknown`, \{\}, `FlatRecord`\<`ObtainDocumentType`\<`any`, `T`, `ResolveSchemaOptions`\<`DefaultSchemaOptions`\>\>\>\> & `Require_id`\<`FlatRecord`\<`ObtainDocumentType`\<`any`, `T`, `ResolveSchemaOptions`\<`DefaultSchemaOptions`\>\>\>\>\>\>

The Mongoose schema to which the middleware will be added

### modelName

`string`

The name of the model associated with the schema

## Returns

`void`

## Defined in

[src/libraries/dbLogger.ts:73](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/dbLogger.ts#L73)
