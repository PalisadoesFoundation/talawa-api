[talawa-api](../README.md) / [Exports](../modules.md) / [types/generatedGraphQLTypes](../modules/types_generatedGraphQLTypes.md) / UploadScalarConfig

# Interface: UploadScalarConfig

[types/generatedGraphQLTypes](../modules/types_generatedGraphQLTypes.md).UploadScalarConfig

## Hierarchy

- `GraphQLScalarTypeConfig`\<[`ResolversTypes`](../modules/types_generatedGraphQLTypes.md#resolverstypes)[``"Upload"``], `any`\>

  ↳ **`UploadScalarConfig`**

## Table of contents

### Properties

- [astNode](types_generatedGraphQLTypes.UploadScalarConfig.md#astnode)
- [description](types_generatedGraphQLTypes.UploadScalarConfig.md#description)
- [extensionASTNodes](types_generatedGraphQLTypes.UploadScalarConfig.md#extensionastnodes)
- [extensions](types_generatedGraphQLTypes.UploadScalarConfig.md#extensions)
- [name](types_generatedGraphQLTypes.UploadScalarConfig.md#name)
- [parseLiteral](types_generatedGraphQLTypes.UploadScalarConfig.md#parseliteral)
- [parseValue](types_generatedGraphQLTypes.UploadScalarConfig.md#parsevalue)
- [serialize](types_generatedGraphQLTypes.UploadScalarConfig.md#serialize)
- [specifiedByURL](types_generatedGraphQLTypes.UploadScalarConfig.md#specifiedbyurl)

## Properties

### astNode

• `Optional` **astNode**: `Maybe`\<`ScalarTypeDefinitionNode`\>

#### Inherited from

GraphQLScalarTypeConfig.astNode

#### Defined in

node_modules/graphql/type/definition.d.ts:369

___

### description

• `Optional` **description**: `Maybe`\<`string`\>

#### Inherited from

GraphQLScalarTypeConfig.description

#### Defined in

node_modules/graphql/type/definition.d.ts:360

___

### extensionASTNodes

• `Optional` **extensionASTNodes**: `Maybe`\<readonly `ScalarTypeExtensionNode`[]\>

#### Inherited from

GraphQLScalarTypeConfig.extensionASTNodes

#### Defined in

node_modules/graphql/type/definition.d.ts:370

___

### extensions

• `Optional` **extensions**: `Maybe`\<`Readonly`\<`GraphQLScalarTypeExtensions`\>\>

#### Inherited from

GraphQLScalarTypeConfig.extensions

#### Defined in

node_modules/graphql/type/definition.d.ts:368

___

### name

• **name**: ``"Upload"``

#### Overrides

GraphQLScalarTypeConfig.name

#### Defined in

[src/types/generatedGraphQLTypes.ts:2965](https://github.com/PalisadoesFoundation/talawa-api/blob/4145524/src/types/generatedGraphQLTypes.ts#L2965)

___

### parseLiteral

• `Optional` **parseLiteral**: `GraphQLScalarLiteralParser`\<`any`\>

Parses an externally provided literal value to use as an input.

#### Inherited from

GraphQLScalarTypeConfig.parseLiteral

#### Defined in

node_modules/graphql/type/definition.d.ts:367

___

### parseValue

• `Optional` **parseValue**: `GraphQLScalarValueParser`\<`any`\>

Parses an externally provided value to use as an input.

#### Inherited from

GraphQLScalarTypeConfig.parseValue

#### Defined in

node_modules/graphql/type/definition.d.ts:365

___

### serialize

• `Optional` **serialize**: `GraphQLScalarSerializer`\<`any`\>

Serializes an internal value to include in a response.

#### Inherited from

GraphQLScalarTypeConfig.serialize

#### Defined in

node_modules/graphql/type/definition.d.ts:363

___

### specifiedByURL

• `Optional` **specifiedByURL**: `Maybe`\<`string`\>

#### Inherited from

GraphQLScalarTypeConfig.specifiedByURL

#### Defined in

node_modules/graphql/type/definition.d.ts:361
