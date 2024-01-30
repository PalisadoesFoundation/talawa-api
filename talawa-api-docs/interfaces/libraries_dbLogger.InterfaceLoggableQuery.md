[talawa-api](../README.md) / [Exports](../modules.md) / [libraries/dbLogger](../modules/libraries_dbLogger.md) / InterfaceLoggableQuery

# Interface: InterfaceLoggableQuery\<T\>

[libraries/dbLogger](../modules/libraries_dbLogger.md).InterfaceLoggableQuery

## Type parameters

| Name |
| :------ |
| `T` |

## Hierarchy

- `Query`\<`unknown`, `T`\>

  ↳ **`InterfaceLoggableQuery`**

## Table of contents

### Properties

- [\_mongooseOptions](libraries_dbLogger.InterfaceLoggableQuery.md#_mongooseoptions)
- [catch](libraries_dbLogger.InterfaceLoggableQuery.md#catch)
- [logInfo](libraries_dbLogger.InterfaceLoggableQuery.md#loginfo)
- [model](libraries_dbLogger.InterfaceLoggableQuery.md#model)
- [then](libraries_dbLogger.InterfaceLoggableQuery.md#then)

### Methods

- [$where](libraries_dbLogger.InterfaceLoggableQuery.md#$where)
- [[asyncIterator]](libraries_dbLogger.InterfaceLoggableQuery.md#[asynciterator])
- [all](libraries_dbLogger.InterfaceLoggableQuery.md#all)
- [and](libraries_dbLogger.InterfaceLoggableQuery.md#and)
- [batchSize](libraries_dbLogger.InterfaceLoggableQuery.md#batchsize)
- [box](libraries_dbLogger.InterfaceLoggableQuery.md#box)
- [cast](libraries_dbLogger.InterfaceLoggableQuery.md#cast)
- [circle](libraries_dbLogger.InterfaceLoggableQuery.md#circle)
- [collation](libraries_dbLogger.InterfaceLoggableQuery.md#collation)
- [comment](libraries_dbLogger.InterfaceLoggableQuery.md#comment)
- [count](libraries_dbLogger.InterfaceLoggableQuery.md#count)
- [countDocuments](libraries_dbLogger.InterfaceLoggableQuery.md#countdocuments)
- [cursor](libraries_dbLogger.InterfaceLoggableQuery.md#cursor)
- [deleteMany](libraries_dbLogger.InterfaceLoggableQuery.md#deletemany)
- [deleteOne](libraries_dbLogger.InterfaceLoggableQuery.md#deleteone)
- [distinct](libraries_dbLogger.InterfaceLoggableQuery.md#distinct)
- [elemMatch](libraries_dbLogger.InterfaceLoggableQuery.md#elemmatch)
- [equals](libraries_dbLogger.InterfaceLoggableQuery.md#equals)
- [error](libraries_dbLogger.InterfaceLoggableQuery.md#error)
- [estimatedDocumentCount](libraries_dbLogger.InterfaceLoggableQuery.md#estimateddocumentcount)
- [exec](libraries_dbLogger.InterfaceLoggableQuery.md#exec)
- [exists](libraries_dbLogger.InterfaceLoggableQuery.md#exists)
- [explain](libraries_dbLogger.InterfaceLoggableQuery.md#explain)
- [find](libraries_dbLogger.InterfaceLoggableQuery.md#find)
- [findByIdAndDelete](libraries_dbLogger.InterfaceLoggableQuery.md#findbyidanddelete)
- [findByIdAndUpdate](libraries_dbLogger.InterfaceLoggableQuery.md#findbyidandupdate)
- [findOne](libraries_dbLogger.InterfaceLoggableQuery.md#findone)
- [findOneAndDelete](libraries_dbLogger.InterfaceLoggableQuery.md#findoneanddelete)
- [findOneAndRemove](libraries_dbLogger.InterfaceLoggableQuery.md#findoneandremove)
- [findOneAndUpdate](libraries_dbLogger.InterfaceLoggableQuery.md#findoneandupdate)
- [geometry](libraries_dbLogger.InterfaceLoggableQuery.md#geometry)
- [get](libraries_dbLogger.InterfaceLoggableQuery.md#get)
- [getFilter](libraries_dbLogger.InterfaceLoggableQuery.md#getfilter)
- [getOptions](libraries_dbLogger.InterfaceLoggableQuery.md#getoptions)
- [getPopulatedPaths](libraries_dbLogger.InterfaceLoggableQuery.md#getpopulatedpaths)
- [getQuery](libraries_dbLogger.InterfaceLoggableQuery.md#getquery)
- [getUpdate](libraries_dbLogger.InterfaceLoggableQuery.md#getupdate)
- [gt](libraries_dbLogger.InterfaceLoggableQuery.md#gt)
- [gte](libraries_dbLogger.InterfaceLoggableQuery.md#gte)
- [hint](libraries_dbLogger.InterfaceLoggableQuery.md#hint)
- [in](libraries_dbLogger.InterfaceLoggableQuery.md#in)
- [intersects](libraries_dbLogger.InterfaceLoggableQuery.md#intersects)
- [j](libraries_dbLogger.InterfaceLoggableQuery.md#j)
- [lean](libraries_dbLogger.InterfaceLoggableQuery.md#lean)
- [limit](libraries_dbLogger.InterfaceLoggableQuery.md#limit)
- [lt](libraries_dbLogger.InterfaceLoggableQuery.md#lt)
- [lte](libraries_dbLogger.InterfaceLoggableQuery.md#lte)
- [map](libraries_dbLogger.InterfaceLoggableQuery.md#map)
- [maxDistance](libraries_dbLogger.InterfaceLoggableQuery.md#maxdistance)
- [maxScan](libraries_dbLogger.InterfaceLoggableQuery.md#maxscan)
- [maxTimeMS](libraries_dbLogger.InterfaceLoggableQuery.md#maxtimems)
- [merge](libraries_dbLogger.InterfaceLoggableQuery.md#merge)
- [mod](libraries_dbLogger.InterfaceLoggableQuery.md#mod)
- [mongooseOptions](libraries_dbLogger.InterfaceLoggableQuery.md#mongooseoptions)
- [ne](libraries_dbLogger.InterfaceLoggableQuery.md#ne)
- [near](libraries_dbLogger.InterfaceLoggableQuery.md#near)
- [nin](libraries_dbLogger.InterfaceLoggableQuery.md#nin)
- [nor](libraries_dbLogger.InterfaceLoggableQuery.md#nor)
- [or](libraries_dbLogger.InterfaceLoggableQuery.md#or)
- [orFail](libraries_dbLogger.InterfaceLoggableQuery.md#orfail)
- [polygon](libraries_dbLogger.InterfaceLoggableQuery.md#polygon)
- [populate](libraries_dbLogger.InterfaceLoggableQuery.md#populate)
- [projection](libraries_dbLogger.InterfaceLoggableQuery.md#projection)
- [read](libraries_dbLogger.InterfaceLoggableQuery.md#read)
- [readConcern](libraries_dbLogger.InterfaceLoggableQuery.md#readconcern)
- [regex](libraries_dbLogger.InterfaceLoggableQuery.md#regex)
- [remove](libraries_dbLogger.InterfaceLoggableQuery.md#remove)
- [replaceOne](libraries_dbLogger.InterfaceLoggableQuery.md#replaceone)
- [select](libraries_dbLogger.InterfaceLoggableQuery.md#select)
- [selected](libraries_dbLogger.InterfaceLoggableQuery.md#selected)
- [selectedExclusively](libraries_dbLogger.InterfaceLoggableQuery.md#selectedexclusively)
- [selectedInclusively](libraries_dbLogger.InterfaceLoggableQuery.md#selectedinclusively)
- [session](libraries_dbLogger.InterfaceLoggableQuery.md#session)
- [set](libraries_dbLogger.InterfaceLoggableQuery.md#set)
- [setOptions](libraries_dbLogger.InterfaceLoggableQuery.md#setoptions)
- [setQuery](libraries_dbLogger.InterfaceLoggableQuery.md#setquery)
- [setUpdate](libraries_dbLogger.InterfaceLoggableQuery.md#setupdate)
- [size](libraries_dbLogger.InterfaceLoggableQuery.md#size)
- [skip](libraries_dbLogger.InterfaceLoggableQuery.md#skip)
- [slice](libraries_dbLogger.InterfaceLoggableQuery.md#slice)
- [snapshot](libraries_dbLogger.InterfaceLoggableQuery.md#snapshot)
- [sort](libraries_dbLogger.InterfaceLoggableQuery.md#sort)
- [tailable](libraries_dbLogger.InterfaceLoggableQuery.md#tailable)
- [toConstructor](libraries_dbLogger.InterfaceLoggableQuery.md#toconstructor)
- [update](libraries_dbLogger.InterfaceLoggableQuery.md#update)
- [updateMany](libraries_dbLogger.InterfaceLoggableQuery.md#updatemany)
- [updateOne](libraries_dbLogger.InterfaceLoggableQuery.md#updateone)
- [w](libraries_dbLogger.InterfaceLoggableQuery.md#w)
- [where](libraries_dbLogger.InterfaceLoggableQuery.md#where)
- [within](libraries_dbLogger.InterfaceLoggableQuery.md#within)
- [wtimeout](libraries_dbLogger.InterfaceLoggableQuery.md#wtimeout)

## Properties

### \_mongooseOptions

• **\_mongooseOptions**: `MongooseQueryOptions`

#### Inherited from

Query.\_mongooseOptions

#### Defined in

node_modules/mongoose/index.d.ts:2150

___

### catch

• **catch**: \<TResult\>(`onrejected?`: ``null`` \| (`reason`: `any`) => `TResult` \| `PromiseLike`\<`TResult`\>) => `Promise`\<`unknown`\>

Executes the query returning a `Promise` which will be
resolved with either the doc(s) or rejected with the error.
Like `.then()`, but only takes a rejection handler.

#### Type declaration

▸ \<`TResult`\>(`onrejected?`): `Promise`\<`unknown`\>

Executes the query returning a `Promise` which will be
resolved with either the doc(s) or rejected with the error.
Like `.then()`, but only takes a rejection handler.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `TResult` | `never` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `onrejected?` | ``null`` \| (`reason`: `any`) => `TResult` \| `PromiseLike`\<`TResult`\> |

##### Returns

`Promise`\<`unknown`\>

#### Inherited from

Query.catch

#### Defined in

node_modules/mongoose/index.d.ts:2195

___

### logInfo

• `Optional` **logInfo**: [`TransactionLogInfo`](../modules/libraries_dbLogger.md#transactionloginfo)

#### Defined in

[src/libraries/dbLogger.ts:37](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/libraries/dbLogger.ts#L37)

___

### model

• **model**: `Model`\<`any`, {}, {}\>

The model this query was created from

#### Inherited from

Query.model

#### Defined in

node_modules/mongoose/index.d.ts:2386

___

### then

• **then**: \<TResult1, TResult2\>(`onfulfilled?`: ``null`` \| (`value`: `unknown`) => `TResult1` \| `PromiseLike`\<`TResult1`\>, `onrejected?`: ``null`` \| (`reason`: `any`) => `TResult2` \| `PromiseLike`\<`TResult2`\>) => `Promise`\<`TResult1` \| `TResult2`\>

Executes the query returning a `Promise` which will be
resolved with either the doc(s) or rejected with the error.

#### Type declaration

▸ \<`TResult1`, `TResult2`\>(`onfulfilled?`, `onrejected?`): `Promise`\<`TResult1` \| `TResult2`\>

Executes the query returning a `Promise` which will be
resolved with either the doc(s) or rejected with the error.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `TResult1` | `unknown` |
| `TResult2` | `never` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `onfulfilled?` | ``null`` \| (`value`: `unknown`) => `TResult1` \| `PromiseLike`\<`TResult1`\> |
| `onrejected?` | ``null`` \| (`reason`: `any`) => `TResult2` \| `PromiseLike`\<`TResult2`\> |

##### Returns

`Promise`\<`TResult1` \| `TResult2`\>

#### Inherited from

Query.then

#### Defined in

node_modules/mongoose/index.d.ts:2516

## Methods

### $where

▸ **$where**(`argument`): `Query`\<`T`[], `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `argument` | `string` \| `Function` |

#### Returns

`Query`\<`T`[], `T`, {}, `T`\>

#### Inherited from

Query.$where

#### Defined in

node_modules/mongoose/index.d.ts:2165

___

### [asyncIterator]

▸ **[asyncIterator]**(): `AsyncIterableIterator`\<`T`\>

Returns a wrapper around a [mongodb driver cursor](http://mongodb.github.io/node-mongodb-native/2.1/api/Cursor.html).
A QueryCursor exposes a Streams3 interface, as well as a `.next()` function.
This is equivalent to calling `.cursor()` with no arguments.

#### Returns

`AsyncIterableIterator`\<`T`\>

#### Inherited from

Query.[asyncIterator]

#### Defined in

node_modules/mongoose/index.d.ts:2157

___

### all

▸ **all**(`val`): `this`

Specifies an `$all` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.all

#### Defined in

node_modules/mongoose/index.d.ts:2168

▸ **all**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.all

#### Defined in

node_modules/mongoose/index.d.ts:2169

___

### and

▸ **and**(`array`): `this`

Specifies arguments for an `$and` condition.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `FilterQuery`\<`T`\>[] |

#### Returns

`this`

#### Inherited from

Query.and

#### Defined in

node_modules/mongoose/index.d.ts:2172

___

### batchSize

▸ **batchSize**(`val`): `this`

Specifies the batchSize option.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.batchSize

#### Defined in

node_modules/mongoose/index.d.ts:2175

___

### box

▸ **box**(`val`): `this`

Specifies a `$box` condition

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.box

#### Defined in

node_modules/mongoose/index.d.ts:2178

▸ **box**(`lower`, `upper`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `lower` | `number`[] |
| `upper` | `number`[] |

#### Returns

`this`

#### Inherited from

Query.box

#### Defined in

node_modules/mongoose/index.d.ts:2179

___

### cast

▸ **cast**(`model?`, `obj?`): `any`

Casts this query to the schema of `model`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `model?` | ``null`` \| `Model`\<`any`, {}, {}\> | the model to cast to. If not set, defaults to `this.model` |
| `obj?` | `any` | If not set, defaults to this query's conditions |

#### Returns

`any`

the casted `obj`

#### Inherited from

Query.cast

#### Defined in

node_modules/mongoose/index.d.ts:2188

___

### circle

▸ **circle**(`area`): `this`

Specifies a `$center` or `$centerSphere` condition.

#### Parameters

| Name | Type |
| :------ | :------ |
| `area` | `any` |

#### Returns

`this`

#### Inherited from

Query.circle

#### Defined in

node_modules/mongoose/index.d.ts:2198

▸ **circle**(`path`, `area`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `area` | `any` |

#### Returns

`this`

#### Inherited from

Query.circle

#### Defined in

node_modules/mongoose/index.d.ts:2199

___

### collation

▸ **collation**(`value`): `this`

Adds a collation to this op (MongoDB 3.4 and up)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `CollationDocument` |

#### Returns

`this`

#### Inherited from

Query.collation

#### Defined in

node_modules/mongoose/index.d.ts:2202

___

### comment

▸ **comment**(`val`): `this`

Specifies the `comment` option.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `string` |

#### Returns

`this`

#### Inherited from

Query.comment

#### Defined in

node_modules/mongoose/index.d.ts:2205

___

### count

▸ **count**(`callback?`): `Query`\<`number`, `T`, {}, `T`\>

Specifies this query as a `count` query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`number`, `T`, {}, `T`\>

#### Inherited from

Query.count

#### Defined in

node_modules/mongoose/index.d.ts:2208

▸ **count**(`criteria`, `callback?`): `Query`\<`number`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `criteria` | `FilterQuery`\<`T`\> |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`number`, `T`, {}, `T`\>

#### Inherited from

Query.count

#### Defined in

node_modules/mongoose/index.d.ts:2209

___

### countDocuments

▸ **countDocuments**(`callback?`): `Query`\<`number`, `T`, {}, `T`\>

Specifies this query as a `countDocuments` query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`number`, `T`, {}, `T`\>

#### Inherited from

Query.countDocuments

#### Defined in

node_modules/mongoose/index.d.ts:2212

▸ **countDocuments**(`criteria`, `callback?`): `Query`\<`number`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `criteria` | `FilterQuery`\<`T`\> |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`number`, `T`, {}, `T`\>

#### Inherited from

Query.countDocuments

#### Defined in

node_modules/mongoose/index.d.ts:2213

___

### cursor

▸ **cursor**(`options?`): `QueryCursor`\<`T`\>

Returns a wrapper around a [mongodb driver cursor](http://mongodb.github.io/node-mongodb-native/2.1/api/Cursor.html).
A QueryCursor exposes a Streams3 interface, as well as a `.next()` function.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `any` |

#### Returns

`QueryCursor`\<`T`\>

#### Inherited from

Query.cursor

#### Defined in

node_modules/mongoose/index.d.ts:2219

___

### deleteMany

▸ **deleteMany**(`filter?`, `options?`, `callback?`): `Query`\<`any`, `T`, {}, `T`\>

Declare and/or execute this query as a `deleteMany()` operation. Works like
remove, except it deletes _every_ document that matches `filter` in the
collection, regardless of the value of `single`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `options?` | `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteMany

#### Defined in

node_modules/mongoose/index.d.ts:2226

▸ **deleteMany**(`filter`, `callback`): `Query`\<`any`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `callback` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteMany

#### Defined in

node_modules/mongoose/index.d.ts:2227

▸ **deleteMany**(`callback`): `Query`\<`any`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteMany

#### Defined in

node_modules/mongoose/index.d.ts:2228

___

### deleteOne

▸ **deleteOne**(`filter?`, `options?`, `callback?`): `Query`\<`any`, `T`, {}, `T`\>

Declare and/or execute this query as a `deleteOne()` operation. Works like
remove, except it deletes at most one document regardless of the `single`
option.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `options?` | `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:2235

▸ **deleteOne**(`filter`, `callback`): `Query`\<`any`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `callback` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:2236

▸ **deleteOne**(`callback`): `Query`\<`any`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:2237

___

### distinct

▸ **distinct**(`field`, `filter?`, `callback?`): `Query`\<`any`[], `T`, {}, `T`\>

Creates a `distinct` query: returns the distinct values of the given `field` that match `filter`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `field` | `string` |
| `filter?` | `FilterQuery`\<`T`\> |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`any`[], `T`, {}, `T`\>

#### Inherited from

Query.distinct

#### Defined in

node_modules/mongoose/index.d.ts:2240

___

### elemMatch

▸ **elemMatch**(`val`): `this`

Specifies a `$elemMatch` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.elemMatch

#### Defined in

node_modules/mongoose/index.d.ts:2243

▸ **elemMatch**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.elemMatch

#### Defined in

node_modules/mongoose/index.d.ts:2244

___

### equals

▸ **equals**(`val`): `this`

Specifies the complementary comparison value for paths specified with `where()`

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.equals

#### Defined in

node_modules/mongoose/index.d.ts:2254

___

### error

▸ **error**(): ``null`` \| `NativeError`

Gets/sets the error flag on this query. If this flag is not null or
undefined, the `exec()` promise will reject without executing.

#### Returns

``null`` \| `NativeError`

#### Inherited from

Query.error

#### Defined in

node_modules/mongoose/index.d.ts:2250

▸ **error**(`val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | ``null`` \| `NativeError` |

#### Returns

`this`

#### Inherited from

Query.error

#### Defined in

node_modules/mongoose/index.d.ts:2251

___

### estimatedDocumentCount

▸ **estimatedDocumentCount**(`options?`, `callback?`): `Query`\<`number`, `T`, {}, `T`\>

Creates a `estimatedDocumentCount` query: counts the number of documents in the collection.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions` |
| `callback?` | `Callback`\<`number`\> |

#### Returns

`Query`\<`number`, `T`, {}, `T`\>

#### Inherited from

Query.estimatedDocumentCount

#### Defined in

node_modules/mongoose/index.d.ts:2257

___

### exec

▸ **exec**(): `Promise`\<`unknown`\>

Executes the query

#### Returns

`Promise`\<`unknown`\>

#### Inherited from

Query.exec

#### Defined in

node_modules/mongoose/index.d.ts:2160

▸ **exec**(`callback?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`\<`unknown`\> |

#### Returns

`void`

#### Inherited from

Query.exec

#### Defined in

node_modules/mongoose/index.d.ts:2161

▸ **exec**(`callback?`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`\<`unknown`\> |

#### Returns

`any`

#### Inherited from

Query.exec

#### Defined in

node_modules/mongoose/index.d.ts:2163

___

### exists

▸ **exists**(`val`): `this`

Specifies a `$exists` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `boolean` |

#### Returns

`this`

#### Inherited from

Query.exists

#### Defined in

node_modules/mongoose/index.d.ts:2260

▸ **exists**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `boolean` |

#### Returns

`this`

#### Inherited from

Query.exists

#### Defined in

node_modules/mongoose/index.d.ts:2261

___

### explain

▸ **explain**(`verbose?`): `this`

Sets the [`explain` option](https://docs.mongodb.com/manual/reference/method/cursor.explain/),
which makes this query return detailed execution stats instead of the actual
query result. This method is useful for determining what index your queries
use.

#### Parameters

| Name | Type |
| :------ | :------ |
| `verbose?` | `string` |

#### Returns

`this`

#### Inherited from

Query.explain

#### Defined in

node_modules/mongoose/index.d.ts:2269

___

### find

▸ **find**(`callback?`): `Query`\<`T`[], `T`, {}, `T`\>

Creates a `find` query: gets a list of documents that match `filter`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`\<`T`[]\> |

#### Returns

`Query`\<`T`[], `T`, {}, `T`\>

#### Inherited from

Query.find

#### Defined in

node_modules/mongoose/index.d.ts:2272

▸ **find**(`filter`, `callback?`): `Query`\<`T`[], `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `callback?` | `Callback`\<`T`[]\> |

#### Returns

`Query`\<`T`[], `T`, {}, `T`\>

#### Inherited from

Query.find

#### Defined in

node_modules/mongoose/index.d.ts:2273

▸ **find**(`filter`, `projection?`, `options?`, `callback?`): `Query`\<`T`[], `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `projection?` | `any` |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`T`[]\> |

#### Returns

`Query`\<`T`[], `T`, {}, `T`\>

#### Inherited from

Query.find

#### Defined in

node_modules/mongoose/index.d.ts:2274

___

### findByIdAndDelete

▸ **findByIdAndDelete**(`id?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

Creates a `findByIdAndDelete` query, filtering by the given `_id`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `any` |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findByIdAndDelete

#### Defined in

node_modules/mongoose/index.d.ts:2291

___

### findByIdAndUpdate

▸ **findByIdAndUpdate**(`id`, `update`, `options`, `callback?`): `Query`\<`FindAndModifyWriteOpResultObject`\<`T`\>, `T`, {}, `T`\>

Creates a `findOneAndUpdate` query, filtering by the given `_id`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `update` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options` | `QueryOptions` & \{ `rawResult`: ``true``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `FindAndModifyWriteOpResultObject`\<`T`\>, `res`: `any`) => `void` |

#### Returns

`Query`\<`FindAndModifyWriteOpResultObject`\<`T`\>, `T`, {}, `T`\>

#### Inherited from

Query.findByIdAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2294

▸ **findByIdAndUpdate**(`id`, `update`, `options`, `callback?`): `Query`\<`T`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `update` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options` | `QueryOptions` & \{ `upsert`: ``true``  } & `ReturnsNewDoc` |
| `callback?` | (`err`: `CallbackError`, `doc`: `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<`T`, `T`, {}, `T`\>

#### Inherited from

Query.findByIdAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2295

▸ **findByIdAndUpdate**(`id?`, `update?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `any` |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findByIdAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2296

___

### findOne

▸ **findOne**(`filter?`, `projection?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

Declares the query a findOne operation. When executed, the first found document is passed to the callback.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `projection?` | `any` |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<``null`` \| `T`\> |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findOne

#### Defined in

node_modules/mongoose/index.d.ts:2277

___

### findOneAndDelete

▸ **findOneAndDelete**(`filter?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

Creates a `findOneAndDelete` query: atomically finds the given document, deletes it, and returns the document as it was before deletion.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findOneAndDelete

#### Defined in

node_modules/mongoose/index.d.ts:2280

___

### findOneAndRemove

▸ **findOneAndRemove**(`filter?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

Creates a `findOneAndRemove` query: atomically finds the given document and deletes it.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findOneAndRemove

#### Defined in

node_modules/mongoose/index.d.ts:2283

___

### findOneAndUpdate

▸ **findOneAndUpdate**(`filter`, `update`, `options`, `callback?`): `Query`\<`FindAndModifyWriteOpResultObject`\<`T`\>, `T`, {}, `T`\>

Creates a `findOneAndUpdate` query: atomically find the first document that matches `filter` and apply `update`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `update` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options` | `QueryOptions` & \{ `rawResult`: ``true``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `FindAndModifyWriteOpResultObject`\<`T`\>, `res`: `any`) => `void` |

#### Returns

`Query`\<`FindAndModifyWriteOpResultObject`\<`T`\>, `T`, {}, `T`\>

#### Inherited from

Query.findOneAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2286

▸ **findOneAndUpdate**(`filter`, `update`, `options`, `callback?`): `Query`\<`T`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `FilterQuery`\<`T`\> |
| `update` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options` | `QueryOptions` & \{ `upsert`: ``true``  } & `ReturnsNewDoc` |
| `callback?` | (`err`: `CallbackError`, `doc`: `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<`T`, `T`, {}, `T`\>

#### Inherited from

Query.findOneAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2287

▸ **findOneAndUpdate**(`filter?`, `update?`, `options?`, `callback?`): `Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `T`, `res`: `any`) => `void` |

#### Returns

`Query`\<``null`` \| `T`, `T`, {}, `T`\>

#### Inherited from

Query.findOneAndUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2288

___

### geometry

▸ **geometry**(`object`): `this`

Specifies a `$geometry` condition

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `Object` |
| `object.coordinates` | `any`[] |
| `object.type` | `string` |

#### Returns

`this`

#### Inherited from

Query.geometry

#### Defined in

node_modules/mongoose/index.d.ts:2299

___

### get

▸ **get**(`path`): `any`

For update operations, returns the value of a path in the update's `$set`.
Useful for writing getters/setters that can work with both update operations
and `save()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`any`

#### Inherited from

Query.get

#### Defined in

node_modules/mongoose/index.d.ts:2306

___

### getFilter

▸ **getFilter**(): `FilterQuery`\<`T`\>

Returns the current query filter (also known as conditions) as a POJO.

#### Returns

`FilterQuery`\<`T`\>

#### Inherited from

Query.getFilter

#### Defined in

node_modules/mongoose/index.d.ts:2309

___

### getOptions

▸ **getOptions**(): `QueryOptions`

Gets query options.

#### Returns

`QueryOptions`

#### Inherited from

Query.getOptions

#### Defined in

node_modules/mongoose/index.d.ts:2312

___

### getPopulatedPaths

▸ **getPopulatedPaths**(): `string`[]

Gets a list of paths to be populated by this query

#### Returns

`string`[]

#### Inherited from

Query.getPopulatedPaths

#### Defined in

node_modules/mongoose/index.d.ts:2315

___

### getQuery

▸ **getQuery**(): `FilterQuery`\<`T`\>

Returns the current query filter. Equivalent to `getFilter()`.

#### Returns

`FilterQuery`\<`T`\>

#### Inherited from

Query.getQuery

#### Defined in

node_modules/mongoose/index.d.ts:2318

___

### getUpdate

▸ **getUpdate**(): ``null`` \| `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\>

Returns the current update operations as a JSON object.

#### Returns

``null`` \| `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\>

#### Inherited from

Query.getUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2321

___

### gt

▸ **gt**(`val`): `this`

Specifies a `$gt` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.gt

#### Defined in

node_modules/mongoose/index.d.ts:2324

▸ **gt**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.gt

#### Defined in

node_modules/mongoose/index.d.ts:2325

___

### gte

▸ **gte**(`val`): `this`

Specifies a `$gte` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.gte

#### Defined in

node_modules/mongoose/index.d.ts:2328

▸ **gte**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.gte

#### Defined in

node_modules/mongoose/index.d.ts:2329

___

### hint

▸ **hint**(`val`): `this`

Sets query hints.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.hint

#### Defined in

node_modules/mongoose/index.d.ts:2332

___

### in

▸ **in**(`val`): `this`

Specifies an `$in` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.in

#### Defined in

node_modules/mongoose/index.d.ts:2335

▸ **in**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.in

#### Defined in

node_modules/mongoose/index.d.ts:2336

___

### intersects

▸ **intersects**(`arg?`): `this`

Declares an intersects query for `geometry()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg?` | `any` |

#### Returns

`this`

#### Inherited from

Query.intersects

#### Defined in

node_modules/mongoose/index.d.ts:2339

___

### j

▸ **j**(`val`): `this`

Requests acknowledgement that this operation has been persisted to MongoDB's on-disk journal.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | ``null`` \| `boolean` |

#### Returns

`this`

#### Inherited from

Query.j

#### Defined in

node_modules/mongoose/index.d.ts:2342

___

### lean

▸ **lean**\<`LeanResultType`\>(`val?`): `Query`\<`LeanResultType`, `T`, {}, `T`\>

Sets the lean option.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `LeanResultType` | `T` extends `Document`\<`any`, `any`, `any`\> ? `unknown` : `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `any` |

#### Returns

`Query`\<`LeanResultType`, `T`, {}, `T`\>

#### Inherited from

Query.lean

#### Defined in

node_modules/mongoose/index.d.ts:2345

___

### limit

▸ **limit**(`val`): `this`

Specifies the maximum number of documents the query will return.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.limit

#### Defined in

node_modules/mongoose/index.d.ts:2348

___

### lt

▸ **lt**(`val`): `this`

Specifies a `$lt` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.lt

#### Defined in

node_modules/mongoose/index.d.ts:2351

▸ **lt**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.lt

#### Defined in

node_modules/mongoose/index.d.ts:2352

___

### lte

▸ **lte**(`val`): `this`

Specifies a `$lte` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.lte

#### Defined in

node_modules/mongoose/index.d.ts:2355

▸ **lte**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.lte

#### Defined in

node_modules/mongoose/index.d.ts:2356

___

### map

▸ **map**\<`MappedType`\>(`fn`): `Query`\<`MappedType`, `T`, {}, `T`\>

Runs a function `fn` and treats the return value of `fn` as the new value
for the query to resolve to.

#### Type parameters

| Name |
| :------ |
| `MappedType` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`doc`: `unknown`) => `MappedType` |

#### Returns

`Query`\<`MappedType`, `T`, {}, `T`\>

#### Inherited from

Query.map

#### Defined in

node_modules/mongoose/index.d.ts:2362

___

### maxDistance

▸ **maxDistance**(`val`): `this`

Specifies an `$maxDistance` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.maxDistance

#### Defined in

node_modules/mongoose/index.d.ts:2365

▸ **maxDistance**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.maxDistance

#### Defined in

node_modules/mongoose/index.d.ts:2366

___

### maxScan

▸ **maxScan**(`val`): `this`

Specifies the maxScan option.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.maxScan

#### Defined in

node_modules/mongoose/index.d.ts:2369

___

### maxTimeMS

▸ **maxTimeMS**(`ms`): `this`

Sets the [maxTimeMS](https://docs.mongodb.com/manual/reference/method/cursor.maxTimeMS/)
option. This will tell the MongoDB server to abort if the query or write op
has been running for more than `ms` milliseconds.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |

#### Returns

`this`

#### Inherited from

Query.maxTimeMS

#### Defined in

node_modules/mongoose/index.d.ts:2376

___

### merge

▸ **merge**(`source`): `this`

Merges another Query or conditions object into this one.

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `Query`\<`any`, `any`, {}, `any`\> \| `FilterQuery`\<`T`\> |

#### Returns

`this`

#### Inherited from

Query.merge

#### Defined in

node_modules/mongoose/index.d.ts:2379

___

### mod

▸ **mod**(`val`): `this`

Specifies a `$mod` condition, filters documents for documents whose `path` property is a number that is equal to `remainder` modulo `divisor`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number`[] |

#### Returns

`this`

#### Inherited from

Query.mod

#### Defined in

node_modules/mongoose/index.d.ts:2382

▸ **mod**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number`[] |

#### Returns

`this`

#### Inherited from

Query.mod

#### Defined in

node_modules/mongoose/index.d.ts:2383

___

### mongooseOptions

▸ **mongooseOptions**(`val?`): `MongooseQueryOptions`

Getter/setter around the current mongoose-specific options for this query
Below are the current Mongoose-specific options.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `MongooseQueryOptions` |

#### Returns

`MongooseQueryOptions`

#### Inherited from

Query.mongooseOptions

#### Defined in

node_modules/mongoose/index.d.ts:2392

___

### ne

▸ **ne**(`val`): `this`

Specifies a `$ne` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.ne

#### Defined in

node_modules/mongoose/index.d.ts:2395

▸ **ne**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.ne

#### Defined in

node_modules/mongoose/index.d.ts:2396

___

### near

▸ **near**(`val`): `this`

Specifies a `$near` or `$nearSphere` condition

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.near

#### Defined in

node_modules/mongoose/index.d.ts:2399

▸ **near**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |

#### Returns

`this`

#### Inherited from

Query.near

#### Defined in

node_modules/mongoose/index.d.ts:2400

___

### nin

▸ **nin**(`val`): `this`

Specifies an `$nin` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.nin

#### Defined in

node_modules/mongoose/index.d.ts:2403

▸ **nin**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.nin

#### Defined in

node_modules/mongoose/index.d.ts:2404

___

### nor

▸ **nor**(`array`): `this`

Specifies arguments for an `$nor` condition.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `FilterQuery`\<`T`\>[] |

#### Returns

`this`

#### Inherited from

Query.nor

#### Defined in

node_modules/mongoose/index.d.ts:2407

___

### or

▸ **or**(`array`): `this`

Specifies arguments for an `$or` condition.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `FilterQuery`\<`T`\>[] |

#### Returns

`this`

#### Inherited from

Query.or

#### Defined in

node_modules/mongoose/index.d.ts:2410

___

### orFail

▸ **orFail**(`err?`): `Query`\<{}, `T`, {}, `T`\>

Make this query throw an error if no documents match the given `filter`.
This is handy for integrating with async/await, because `orFail()` saves you
an extra `if` statement to check if no document was found.

#### Parameters

| Name | Type |
| :------ | :------ |
| `err?` | `NativeError` \| () => `NativeError` |

#### Returns

`Query`\<{}, `T`, {}, `T`\>

#### Inherited from

Query.orFail

#### Defined in

node_modules/mongoose/index.d.ts:2417

___

### polygon

▸ **polygon**(`...coordinatePairs`): `this`

Specifies a `$polygon` condition

#### Parameters

| Name | Type |
| :------ | :------ |
| `...coordinatePairs` | `number`[][] |

#### Returns

`this`

#### Inherited from

Query.polygon

#### Defined in

node_modules/mongoose/index.d.ts:2420

▸ **polygon**(`path`, `...coordinatePairs`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `...coordinatePairs` | `number`[][] |

#### Returns

`this`

#### Inherited from

Query.polygon

#### Defined in

node_modules/mongoose/index.d.ts:2421

___

### populate

▸ **populate**(`path`, `select?`, `model?`, `match?`): `this`

Specifies paths which should be populated with other documents.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `any` |
| `select?` | `any` |
| `model?` | `string` \| `Model`\<`any`, {}, {}\> |
| `match?` | `any` |

#### Returns

`this`

#### Inherited from

Query.populate

#### Defined in

node_modules/mongoose/index.d.ts:2424

▸ **populate**(`options`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `PopulateOptions` \| `PopulateOptions`[] |

#### Returns

`this`

#### Inherited from

Query.populate

#### Defined in

node_modules/mongoose/index.d.ts:2425

___

### projection

▸ **projection**(`fields?`): `any`

Get/set the current projection (AKA fields). Pass `null` to remove the current projection.

#### Parameters

| Name | Type |
| :------ | :------ |
| `fields?` | `any` |

#### Returns

`any`

#### Inherited from

Query.projection

#### Defined in

node_modules/mongoose/index.d.ts:2428

___

### read

▸ **read**(`pref`, `tags?`): `this`

Determines the MongoDB nodes from which to read.

#### Parameters

| Name | Type |
| :------ | :------ |
| `pref` | `string` |
| `tags?` | `any`[] |

#### Returns

`this`

#### Inherited from

Query.read

#### Defined in

node_modules/mongoose/index.d.ts:2431

___

### readConcern

▸ **readConcern**(`level`): `this`

Sets the readConcern option for the query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `level` | `string` |

#### Returns

`this`

#### Inherited from

Query.readConcern

#### Defined in

node_modules/mongoose/index.d.ts:2434

___

### regex

▸ **regex**(`val`): `this`

Specifies a `$regex` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `string` \| `RegExp` |

#### Returns

`this`

#### Inherited from

Query.regex

#### Defined in

node_modules/mongoose/index.d.ts:2437

▸ **regex**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `string` \| `RegExp` |

#### Returns

`this`

#### Inherited from

Query.regex

#### Defined in

node_modules/mongoose/index.d.ts:2438

___

### remove

▸ **remove**(`filter?`, `callback?`): `Query`\<`any`, `T`, {}, `T`\>

Declare and/or execute this query as a remove() operation. `remove()` is
deprecated, you should use [`deleteOne()`](#query_Query-deleteOne)
or [`deleteMany()`](#query_Query-deleteMany) instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.remove

#### Defined in

node_modules/mongoose/index.d.ts:2445

___

### replaceOne

▸ **replaceOne**(`filter?`, `replacement?`, `options?`, `callback?`): `Query`\<`any`, `T`, {}, `T`\>

Declare and/or execute this query as a replaceOne() operation. Same as
`update()`, except MongoDB will replace the existing document and will
not accept any [atomic](https://docs.mongodb.com/manual/tutorial/model-data-for-atomic-operations/#pattern) operators (`$set`, etc.)

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `replacement?` | `DocumentDefinition`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.replaceOne

#### Defined in

node_modules/mongoose/index.d.ts:2452

▸ **replaceOne**(`filter?`, `replacement?`, `options?`, `callback?`): `Query`\<`any`, `T`, {}, `T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `replacement?` | `Object` |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, `T`, {}, `T`\>

#### Inherited from

Query.replaceOne

#### Defined in

node_modules/mongoose/index.d.ts:2453

___

### select

▸ **select**(`arg`): `this`

Specifies which document fields to include or exclude (also known as the query "projection")

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `any` |

#### Returns

`this`

#### Inherited from

Query.select

#### Defined in

node_modules/mongoose/index.d.ts:2456

___

### selected

▸ **selected**(): `boolean`

Determines if field selection has been made.

#### Returns

`boolean`

#### Inherited from

Query.selected

#### Defined in

node_modules/mongoose/index.d.ts:2459

___

### selectedExclusively

▸ **selectedExclusively**(): `boolean`

Determines if exclusive field selection has been made.

#### Returns

`boolean`

#### Inherited from

Query.selectedExclusively

#### Defined in

node_modules/mongoose/index.d.ts:2462

___

### selectedInclusively

▸ **selectedInclusively**(): `boolean`

Determines if inclusive field selection has been made.

#### Returns

`boolean`

#### Inherited from

Query.selectedInclusively

#### Defined in

node_modules/mongoose/index.d.ts:2465

___

### session

▸ **session**(`session`): `this`

Sets the [MongoDB session](https://docs.mongodb.com/manual/reference/server-sessions/)
associated with this query. Sessions are how you mark a query as part of a
[transaction](/docs/transactions.html).

#### Parameters

| Name | Type |
| :------ | :------ |
| `session` | ``null`` \| `ClientSession` |

#### Returns

`this`

#### Inherited from

Query.session

#### Defined in

node_modules/mongoose/index.d.ts:2472

___

### set

▸ **set**(`path`, `value?`): `this`

Adds a `$set` to this query's update without changing the operation.
This is useful for query middleware so you can add an update regardless
of whether you use `updateOne()`, `updateMany()`, `findOneAndUpdate()`, etc.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` \| `Record`\<`string`, `unknown`\> |
| `value?` | `any` |

#### Returns

`this`

#### Inherited from

Query.set

#### Defined in

node_modules/mongoose/index.d.ts:2479

___

### setOptions

▸ **setOptions**(`options`, `overwrite?`): `this`

Sets query options. Some options only make sense for certain operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `QueryOptions` |
| `overwrite?` | `boolean` |

#### Returns

`this`

#### Inherited from

Query.setOptions

#### Defined in

node_modules/mongoose/index.d.ts:2482

___

### setQuery

▸ **setQuery**(`val`): `void`

Sets the query conditions to the provided JSON object.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | ``null`` \| `FilterQuery`\<`T`\> |

#### Returns

`void`

#### Inherited from

Query.setQuery

#### Defined in

node_modules/mongoose/index.d.ts:2485

___

### setUpdate

▸ **setUpdate**(`update`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `update` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |

#### Returns

`void`

#### Inherited from

Query.setUpdate

#### Defined in

node_modules/mongoose/index.d.ts:2487

___

### size

▸ **size**(`val`): `this`

Specifies an `$size` query condition. When called with one argument, the most recent path passed to `where()` is used.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.size

#### Defined in

node_modules/mongoose/index.d.ts:2490

▸ **size**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.size

#### Defined in

node_modules/mongoose/index.d.ts:2491

___

### skip

▸ **skip**(`val`): `this`

Specifies the number of documents to skip.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` |

#### Returns

`this`

#### Inherited from

Query.skip

#### Defined in

node_modules/mongoose/index.d.ts:2494

___

### slice

▸ **slice**(`val`): `this`

Specifies a `$slice` projection for an array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `number` \| `number`[] |

#### Returns

`this`

#### Inherited from

Query.slice

#### Defined in

node_modules/mongoose/index.d.ts:2497

▸ **slice**(`path`, `val`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `number` \| `number`[] |

#### Returns

`this`

#### Inherited from

Query.slice

#### Defined in

node_modules/mongoose/index.d.ts:2498

___

### snapshot

▸ **snapshot**(`val?`): `this`

Specifies this query as a `snapshot` query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `boolean` |

#### Returns

`this`

#### Inherited from

Query.snapshot

#### Defined in

node_modules/mongoose/index.d.ts:2501

___

### sort

▸ **sort**(`arg`): `this`

Sets the sort order. If an object is passed, values allowed are `asc`, `desc`, `ascending`, `descending`, `1`, and `-1`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `any` |

#### Returns

`this`

#### Inherited from

Query.sort

#### Defined in

node_modules/mongoose/index.d.ts:2504

___

### tailable

▸ **tailable**(`bool?`, `opts?`): `this`

Sets the tailable option (for use with capped collections).

#### Parameters

| Name | Type |
| :------ | :------ |
| `bool?` | `boolean` |
| `opts?` | `Object` |
| `opts.numberOfRetries?` | `number` |
| `opts.tailableRetryInterval?` | `number` |

#### Returns

`this`

#### Inherited from

Query.tailable

#### Defined in

node_modules/mongoose/index.d.ts:2507

___

### toConstructor

▸ **toConstructor**(): (...`args`: `any`[]) => `Query`\<`unknown`, `T`, {}, `T`\>

Converts this query to a customized, reusable query constructor with all arguments and options retained.

#### Returns

`fn`

• **new toConstructor**(`...args`): `Query`\<`unknown`, `T`, {}, `T`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`Query`\<`unknown`, `T`, {}, `T`\>

#### Inherited from

Query.toConstructor

#### Defined in

node_modules/mongoose/index.d.ts:2519

___

### update

▸ **update**(`filter?`, `update?`, `options?`, `callback?`): `Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

Declare and/or execute this query as an update() operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`UpdateWriteOpResult`\> |

#### Returns

`Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

#### Inherited from

Query.update

#### Defined in

node_modules/mongoose/index.d.ts:2522

___

### updateMany

▸ **updateMany**(`filter?`, `update?`, `options?`, `callback?`): `Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

Declare and/or execute this query as an updateMany() operation. Same as
`update()`, except MongoDB will update _all_ documents that match
`filter` (as opposed to just the first one) regardless of the value of
the `multi` option.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`UpdateWriteOpResult`\> |

#### Returns

`Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

#### Inherited from

Query.updateMany

#### Defined in

node_modules/mongoose/index.d.ts:2530

___

### updateOne

▸ **updateOne**(`filter?`, `update?`, `options?`, `callback?`): `Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

Declare and/or execute this query as an updateOne() operation. Same as
`update()`, except it does not support the `multi` or `overwrite` options.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `FilterQuery`\<`T`\> |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<`T`\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`UpdateWriteOpResult`\> |

#### Returns

`Query`\<`UpdateWriteOpResult`, `T`, {}, `T`\>

#### Inherited from

Query.updateOne

#### Defined in

node_modules/mongoose/index.d.ts:2536

___

### w

▸ **w**(`val`): `this`

Sets the specified number of `mongod` servers, or tag set of `mongod` servers,
that must acknowledge this write before this write is considered successful.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | ``null`` \| `string` \| `number` |

#### Returns

`this`

#### Inherited from

Query.w

#### Defined in

node_modules/mongoose/index.d.ts:2542

___

### where

▸ **where**(`path`, `val?`): `this`

Specifies a path for use with chaining.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val?` | `any` |

#### Returns

`this`

#### Inherited from

Query.where

#### Defined in

node_modules/mongoose/index.d.ts:2545

▸ **where**(`obj`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `object` |

#### Returns

`this`

#### Inherited from

Query.where

#### Defined in

node_modules/mongoose/index.d.ts:2546

▸ **where**(): `this`

#### Returns

`this`

#### Inherited from

Query.where

#### Defined in

node_modules/mongoose/index.d.ts:2547

___

### within

▸ **within**(`val?`): `this`

Defines a `$within` or `$geoWithin` argument for geo-spatial queries.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `any` |

#### Returns

`this`

#### Inherited from

Query.within

#### Defined in

node_modules/mongoose/index.d.ts:2550

___

### wtimeout

▸ **wtimeout**(`ms`): `this`

If [`w > 1`](/docs/api.html#query_Query-w), the maximum amount of time to
wait for this write to propagate through the replica set before this
operation fails. The default is `0`, which means no timeout.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |

#### Returns

`this`

#### Inherited from

Query.wtimeout

#### Defined in

node_modules/mongoose/index.d.ts:2557
