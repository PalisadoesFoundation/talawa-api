[talawa-api](../README.md) / [Exports](../modules.md) / [libraries/dbLogger](../modules/libraries_dbLogger.md) / InterfaceLoggableDocument

# Interface: InterfaceLoggableDocument

[libraries/dbLogger](../modules/libraries_dbLogger.md).InterfaceLoggableDocument

## Hierarchy

- `Document`

  ↳ **`InterfaceLoggableDocument`**

## Table of contents

### Properties

- [$locals](libraries_dbLogger.InterfaceLoggableDocument.md#$locals)
- [$op](libraries_dbLogger.InterfaceLoggableDocument.md#$op)
- [$where](libraries_dbLogger.InterfaceLoggableDocument.md#$where)
- [\_\_v](libraries_dbLogger.InterfaceLoggableDocument.md#__v)
- [\_id](libraries_dbLogger.InterfaceLoggableDocument.md#_id)
- [baseModelName](libraries_dbLogger.InterfaceLoggableDocument.md#basemodelname)
- [collection](libraries_dbLogger.InterfaceLoggableDocument.md#collection)
- [db](libraries_dbLogger.InterfaceLoggableDocument.md#db)
- [errors](libraries_dbLogger.InterfaceLoggableDocument.md#errors)
- [id](libraries_dbLogger.InterfaceLoggableDocument.md#id)
- [isNew](libraries_dbLogger.InterfaceLoggableDocument.md#isnew)
- [logInfo](libraries_dbLogger.InterfaceLoggableDocument.md#loginfo)
- [modelName](libraries_dbLogger.InterfaceLoggableDocument.md#modelname)
- [schema](libraries_dbLogger.InterfaceLoggableDocument.md#schema)

### Methods

- [$getAllSubdocs](libraries_dbLogger.InterfaceLoggableDocument.md#$getallsubdocs)
- [$getPopulatedDocs](libraries_dbLogger.InterfaceLoggableDocument.md#$getpopulateddocs)
- [$ignore](libraries_dbLogger.InterfaceLoggableDocument.md#$ignore)
- [$isDefault](libraries_dbLogger.InterfaceLoggableDocument.md#$isdefault)
- [$isDeleted](libraries_dbLogger.InterfaceLoggableDocument.md#$isdeleted)
- [$isEmpty](libraries_dbLogger.InterfaceLoggableDocument.md#$isempty)
- [$isValid](libraries_dbLogger.InterfaceLoggableDocument.md#$isvalid)
- [$markValid](libraries_dbLogger.InterfaceLoggableDocument.md#$markvalid)
- [$parent](libraries_dbLogger.InterfaceLoggableDocument.md#$parent)
- [$session](libraries_dbLogger.InterfaceLoggableDocument.md#$session)
- [$set](libraries_dbLogger.InterfaceLoggableDocument.md#$set)
- [delete](libraries_dbLogger.InterfaceLoggableDocument.md#delete)
- [deleteOne](libraries_dbLogger.InterfaceLoggableDocument.md#deleteone)
- [depopulate](libraries_dbLogger.InterfaceLoggableDocument.md#depopulate)
- [directModifiedPaths](libraries_dbLogger.InterfaceLoggableDocument.md#directmodifiedpaths)
- [equals](libraries_dbLogger.InterfaceLoggableDocument.md#equals)
- [execPopulate](libraries_dbLogger.InterfaceLoggableDocument.md#execpopulate)
- [get](libraries_dbLogger.InterfaceLoggableDocument.md#get)
- [getChanges](libraries_dbLogger.InterfaceLoggableDocument.md#getchanges)
- [increment](libraries_dbLogger.InterfaceLoggableDocument.md#increment)
- [init](libraries_dbLogger.InterfaceLoggableDocument.md#init)
- [invalidate](libraries_dbLogger.InterfaceLoggableDocument.md#invalidate)
- [isDirectModified](libraries_dbLogger.InterfaceLoggableDocument.md#isdirectmodified)
- [isDirectSelected](libraries_dbLogger.InterfaceLoggableDocument.md#isdirectselected)
- [isInit](libraries_dbLogger.InterfaceLoggableDocument.md#isinit)
- [isModified](libraries_dbLogger.InterfaceLoggableDocument.md#ismodified)
- [isSelected](libraries_dbLogger.InterfaceLoggableDocument.md#isselected)
- [markModified](libraries_dbLogger.InterfaceLoggableDocument.md#markmodified)
- [model](libraries_dbLogger.InterfaceLoggableDocument.md#model)
- [modifiedPaths](libraries_dbLogger.InterfaceLoggableDocument.md#modifiedpaths)
- [overwrite](libraries_dbLogger.InterfaceLoggableDocument.md#overwrite)
- [populate](libraries_dbLogger.InterfaceLoggableDocument.md#populate)
- [populated](libraries_dbLogger.InterfaceLoggableDocument.md#populated)
- [remove](libraries_dbLogger.InterfaceLoggableDocument.md#remove)
- [replaceOne](libraries_dbLogger.InterfaceLoggableDocument.md#replaceone)
- [save](libraries_dbLogger.InterfaceLoggableDocument.md#save)
- [set](libraries_dbLogger.InterfaceLoggableDocument.md#set)
- [toJSON](libraries_dbLogger.InterfaceLoggableDocument.md#tojson)
- [toObject](libraries_dbLogger.InterfaceLoggableDocument.md#toobject)
- [unmarkModified](libraries_dbLogger.InterfaceLoggableDocument.md#unmarkmodified)
- [update](libraries_dbLogger.InterfaceLoggableDocument.md#update)
- [updateOne](libraries_dbLogger.InterfaceLoggableDocument.md#updateone)
- [validate](libraries_dbLogger.InterfaceLoggableDocument.md#validate)
- [validateSync](libraries_dbLogger.InterfaceLoggableDocument.md#validatesync)

## Properties

### $locals

• **$locals**: `Record`\<`string`, `unknown`\>

Empty object that you can use for storing properties on the document. This
is handy for passing data to middleware without conflicting with Mongoose
internals.

#### Inherited from

Document.$locals

#### Defined in

node_modules/mongoose/index.d.ts:554

___

### $op

• **$op**: ``null`` \| `string`

A string containing the current operation that Mongoose is executing
on this document. May be `null`, `'save'`, `'validate'`, or `'remove'`.

#### Inherited from

Document.$op

#### Defined in

node_modules/mongoose/index.d.ts:563

___

### $where

• **$where**: `Record`\<`string`, `unknown`\>

Set this property to add additional query filters when Mongoose saves this document and `isNew` is false.

#### Inherited from

Document.$where

#### Defined in

node_modules/mongoose/index.d.ts:578

___

### \_\_v

• `Optional` **\_\_v**: `any`

This documents __v.

#### Inherited from

Document.\_\_v

#### Defined in

node_modules/mongoose/index.d.ts:522

___

### \_id

• `Optional` **\_id**: `any`

This documents _id.

#### Inherited from

Document.\_id

#### Defined in

node_modules/mongoose/index.d.ts:519

___

### baseModelName

• `Optional` **baseModelName**: `string`

If this is a discriminator model, `baseModelName` is the name of the base model.

#### Inherited from

Document.baseModelName

#### Defined in

node_modules/mongoose/index.d.ts:581

___

### collection

• **collection**: `Collection`

Collection the model uses.

#### Inherited from

Document.collection

#### Defined in

node_modules/mongoose/index.d.ts:584

___

### db

• **db**: `Connection`

Connection the model uses.

#### Inherited from

Document.db

#### Defined in

node_modules/mongoose/index.d.ts:587

___

### errors

• `Optional` **errors**: `ValidationError`

Hash containing current validation errors.

#### Inherited from

Document.errors

#### Defined in

node_modules/mongoose/index.d.ts:619

___

### id

• `Optional` **id**: `any`

The string version of this documents _id.

#### Inherited from

Document.id

#### Defined in

node_modules/mongoose/index.d.ts:635

___

### isNew

• **isNew**: `boolean`

Boolean flag specifying if the document is new.

#### Inherited from

Document.isNew

#### Defined in

node_modules/mongoose/index.d.ts:666

___

### logInfo

• **logInfo**: [`TransactionLogInfo`](../modules/libraries_dbLogger.md#transactionloginfo)

#### Defined in

[src/libraries/dbLogger.ts:33](https://github.com/PalisadoesFoundation/talawa-api/blob/8707a9c/src/libraries/dbLogger.ts#L33)

___

### modelName

• **modelName**: `string`

The name of the model

#### Inherited from

Document.modelName

#### Defined in

node_modules/mongoose/index.d.ts:681

___

### schema

• **schema**: `Schema`\<`Document`\<`any`, `any`, `any`\>, `Model`\<`Document`\<`any`, `any`, `any`\>, `any`, `any`\>, `undefined`, \{\}\>

The document's schema.

#### Inherited from

Document.schema

#### Defined in

node_modules/mongoose/index.d.ts:722

## Methods

### $getAllSubdocs

▸ **$getAllSubdocs**(): `Document`\<`any`, `any`, `any`\>[]

#### Returns

`Document`\<`any`, `any`, `any`\>[]

#### Inherited from

Document.$getAllSubdocs

#### Defined in

node_modules/mongoose/index.d.ts:525

___

### $getPopulatedDocs

▸ **$getPopulatedDocs**(): `Document`\<`any`, `any`, `any`\>[]

Returns an array of all populated documents associated with the query

#### Returns

`Document`\<`any`, `any`, `any`\>[]

#### Inherited from

Document.$getPopulatedDocs

#### Defined in

node_modules/mongoose/index.d.ts:537

___

### $ignore

▸ **$ignore**(`path`): `void`

Don't run validation on this path or persist changes to this path.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`void`

#### Inherited from

Document.$ignore

#### Defined in

node_modules/mongoose/index.d.ts:528

___

### $isDefault

▸ **$isDefault**(`path`): `boolean`

Checks if a path is set to its default.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.$isDefault

#### Defined in

node_modules/mongoose/index.d.ts:531

___

### $isDeleted

▸ **$isDeleted**(`val?`): `boolean`

Getter/setter, determines whether the document was removed or not.

#### Parameters

| Name | Type |
| :------ | :------ |
| `val?` | `boolean` |

#### Returns

`boolean`

#### Inherited from

Document.$isDeleted

#### Defined in

node_modules/mongoose/index.d.ts:534

___

### $isEmpty

▸ **$isEmpty**(`path`): `boolean`

Returns true if the given path is nullish or only contains empty objects.
Useful for determining whether this subdoc will get stripped out by the
[minimize option](/docs/guide.html#minimize).

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.$isEmpty

#### Defined in

node_modules/mongoose/index.d.ts:544

___

### $isValid

▸ **$isValid**(`path`): `boolean`

Checks if a path is invalid

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.$isValid

#### Defined in

node_modules/mongoose/index.d.ts:547

___

### $markValid

▸ **$markValid**(`path`): `void`

Marks a path as valid, removing existing validation errors.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`void`

#### Inherited from

Document.$markValid

#### Defined in

node_modules/mongoose/index.d.ts:557

___

### $parent

▸ **$parent**(): `undefined` \| `Document`\<`any`, `any`, `any`\>

If this document is a subdocument or populated document, returns the
document's parent. Returns undefined otherwise.

#### Returns

`undefined` \| `Document`\<`any`, `any`, `any`\>

#### Inherited from

Document.$parent

#### Defined in

node_modules/mongoose/index.d.ts:694

___

### $session

▸ **$session**(`session?`): `ClientSession`

Getter/setter around the session associated with this document. Used to
automatically set `session` if you `save()` a doc that you got from a
query with an associated session.

#### Parameters

| Name | Type |
| :------ | :------ |
| `session?` | ``null`` \| `ClientSession` |

#### Returns

`ClientSession`

#### Inherited from

Document.$session

#### Defined in

node_modules/mongoose/index.d.ts:570

___

### $set

▸ **$set**(`path`, `val`, `options?`): `this`

Alias for `set()`, used internally to avoid conflicts

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |
| `options?` | `any` |

#### Returns

`this`

#### Inherited from

Document.$set

#### Defined in

node_modules/mongoose/index.d.ts:573

▸ **$set**(`path`, `val`, `type`, `options?`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |
| `type` | `any` |
| `options?` | `any` |

#### Returns

`this`

#### Inherited from

Document.$set

#### Defined in

node_modules/mongoose/index.d.ts:574

▸ **$set**(`value`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |

#### Returns

`this`

#### Inherited from

Document.$set

#### Defined in

node_modules/mongoose/index.d.ts:575

___

### delete

▸ **delete**(`options?`): `any`

Removes this document from the db.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions` |

#### Returns

`any`

#### Inherited from

Document.delete

#### Defined in

node_modules/mongoose/index.d.ts:590

▸ **delete**(`options`, `cb?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `QueryOptions` |
| `cb?` | `Callback`\<`any`\> |

#### Returns

`void`

#### Inherited from

Document.delete

#### Defined in

node_modules/mongoose/index.d.ts:591

▸ **delete**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `Callback`\<`any`\> |

#### Returns

`void`

#### Inherited from

Document.delete

#### Defined in

node_modules/mongoose/index.d.ts:592

___

### deleteOne

▸ **deleteOne**(`options?`): `any`

Removes this document from the db.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions` |

#### Returns

`any`

#### Inherited from

Document.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:595

▸ **deleteOne**(`options`, `cb?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `QueryOptions` |
| `cb?` | `Callback`\<`any`\> |

#### Returns

`void`

#### Inherited from

Document.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:596

▸ **deleteOne**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `Callback`\<`any`\> |

#### Returns

`void`

#### Inherited from

Document.deleteOne

#### Defined in

node_modules/mongoose/index.d.ts:597

___

### depopulate

▸ **depopulate**(`path`): `this`

Takes a populated field and returns it to its unpopulated state.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`this`

#### Inherited from

Document.depopulate

#### Defined in

node_modules/mongoose/index.d.ts:600

___

### directModifiedPaths

▸ **directModifiedPaths**(): `string`[]

Returns the list of paths that have been directly modified. A direct
modified path is a path that you explicitly set, whether via `doc.foo = 'bar'`,
`Object.assign(doc, \{ foo: 'bar' \})`, or `doc.set('foo', 'bar')`.

#### Returns

`string`[]

#### Inherited from

Document.directModifiedPaths

#### Defined in

node_modules/mongoose/index.d.ts:607

___

### equals

▸ **equals**(`doc`): `boolean`

Returns true if this document is equal to another document.

Documents are considered equal when they have matching `_id`s, unless neither
document has an `_id`, in which case this function falls back to using
`deepEqual()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `Document`\<`any`, `any`, `any`\> |

#### Returns

`boolean`

#### Inherited from

Document.equals

#### Defined in

node_modules/mongoose/index.d.ts:616

___

### execPopulate

▸ **execPopulate**(): `Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Explicitly executes population and returns a promise. Useful for promises integration.

#### Returns

`Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.execPopulate

#### Defined in

node_modules/mongoose/index.d.ts:622

▸ **execPopulate**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`void`

#### Inherited from

Document.execPopulate

#### Defined in

node_modules/mongoose/index.d.ts:623

___

### get

▸ **get**(`path`, `type?`, `options?`): `any`

Returns the value of a path.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `type?` | `any` |
| `options?` | `any` |

#### Returns

`any`

#### Inherited from

Document.get

#### Defined in

node_modules/mongoose/index.d.ts:626

___

### getChanges

▸ **getChanges**(): `UpdateQuery`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Returns the changes that happened to the document
in the format that will be sent to MongoDB.

#### Returns

`UpdateQuery`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.getChanges

#### Defined in

node_modules/mongoose/index.d.ts:632

___

### increment

▸ **increment**(): `this`

Signal that we desire an increment of this documents version.

#### Returns

`this`

#### Inherited from

Document.increment

#### Defined in

node_modules/mongoose/index.d.ts:638

___

### init

▸ **init**(`obj`, `opts?`, `cb?`): `this`

Initializes the document without setters or marking anything modified.
Called internally after a document is returned from mongodb. Normally,
you do **not** need to call this function on your own.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |
| `opts?` | `any` |
| `cb?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`this`

#### Inherited from

Document.init

#### Defined in

node_modules/mongoose/index.d.ts:645

___

### invalidate

▸ **invalidate**(`path`, `errorMsg`, `value?`, `kind?`): ``null`` \| `NativeError`

Marks a path as invalid, causing validation to fail.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `errorMsg` | `string` \| `NativeError` |
| `value?` | `any` |
| `kind?` | `string` |

#### Returns

``null`` \| `NativeError`

#### Inherited from

Document.invalidate

#### Defined in

node_modules/mongoose/index.d.ts:648

___

### isDirectModified

▸ **isDirectModified**(`path`): `boolean`

Returns true if `path` was directly set and modified, else false.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.isDirectModified

#### Defined in

node_modules/mongoose/index.d.ts:651

___

### isDirectSelected

▸ **isDirectSelected**(`path`): `boolean`

Checks if `path` was explicitly selected. If no projection, always returns true.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.isDirectSelected

#### Defined in

node_modules/mongoose/index.d.ts:654

___

### isInit

▸ **isInit**(`path`): `boolean`

Checks if `path` is in the `init` state, that is, it was set by `Document#init()` and not modified since.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.isInit

#### Defined in

node_modules/mongoose/index.d.ts:657

___

### isModified

▸ **isModified**(`path?`): `boolean`

Returns true if any of the given paths is modified, else false. If no arguments, returns `true` if any path
in this document is modified.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path?` | `string` \| `string`[] |

#### Returns

`boolean`

#### Inherited from

Document.isModified

#### Defined in

node_modules/mongoose/index.d.ts:663

___

### isSelected

▸ **isSelected**(`path`): `boolean`

Checks if `path` was selected in the source query which initialized this document.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`boolean`

#### Inherited from

Document.isSelected

#### Defined in

node_modules/mongoose/index.d.ts:669

___

### markModified

▸ **markModified**(`path`, `scope?`): `void`

Marks the path as having pending changes to write to the db.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `scope?` | `any` |

#### Returns

`void`

#### Inherited from

Document.markModified

#### Defined in

node_modules/mongoose/index.d.ts:672

___

### model

▸ **model**\<`T`\>(`name`): `T`

Returns another Model instance.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Model`\<`any`, \{\}, \{\}\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`T`

#### Inherited from

Document.model

#### Defined in

node_modules/mongoose/index.d.ts:678

___

### modifiedPaths

▸ **modifiedPaths**(`options?`): `string`[]

Returns the list of paths that have been modified.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `Object` |
| `options.includeChildren?` | `boolean` |

#### Returns

`string`[]

#### Inherited from

Document.modifiedPaths

#### Defined in

node_modules/mongoose/index.d.ts:675

___

### overwrite

▸ **overwrite**(`obj`): `this`

Overwrite all values in this document with the values of `obj`, except
for immutable properties. Behaves similarly to `set()`, except for it
unsets all properties that aren't in `obj`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `DocumentDefinition`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`this`

#### Inherited from

Document.overwrite

#### Defined in

node_modules/mongoose/index.d.ts:688

___

### populate

▸ **populate**(`path`, `callback?`): `this`

Populates document references, executing the `callback` when complete.
If you want to use promises instead, use this function with
[`execPopulate()`](#document_Document-execPopulate).

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `callback?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`this`

#### Inherited from

Document.populate

#### Defined in

node_modules/mongoose/index.d.ts:701

▸ **populate**(`path`, `names`, `callback?`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `names` | `string` |
| `callback?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`this`

#### Inherited from

Document.populate

#### Defined in

node_modules/mongoose/index.d.ts:702

▸ **populate**(`opts`, `callback?`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `PopulateOptions` \| `PopulateOptions`[] |
| `callback?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`this`

#### Inherited from

Document.populate

#### Defined in

node_modules/mongoose/index.d.ts:703

___

### populated

▸ **populated**(`path`): `any`

Gets _id(s) used during population of the given `path`. If the path was not populated, returns `undefined`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`any`

#### Inherited from

Document.populated

#### Defined in

node_modules/mongoose/index.d.ts:706

___

### remove

▸ **remove**(`options?`): `Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Removes this document from the db.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions` |

#### Returns

`Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.remove

#### Defined in

node_modules/mongoose/index.d.ts:709

▸ **remove**(`options?`, `cb?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions` |
| `cb?` | `Callback`\<`any`\> |

#### Returns

`void`

#### Inherited from

Document.remove

#### Defined in

node_modules/mongoose/index.d.ts:710

___

### replaceOne

▸ **replaceOne**(`replacement?`, `options?`, `callback?`): `Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Sends a replaceOne command with this document `_id` as the query selector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `replacement?` | `DocumentDefinition`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.replaceOne

#### Defined in

node_modules/mongoose/index.d.ts:713

▸ **replaceOne**(`replacement?`, `options?`, `callback?`): `Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `replacement?` | `Object` |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.replaceOne

#### Defined in

node_modules/mongoose/index.d.ts:714

___

### save

▸ **save**(`options?`): `Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Saves this document by inserting a new document into the database if [document.isNew](/docs/api.html#document_Document-isNew) is `true`, or sends an [updateOne](/docs/api.html#document_Document-updateOne) operation with just the modified paths if `isNew` is `false`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `SaveOptions` |

#### Returns

`Promise`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.save

#### Defined in

node_modules/mongoose/index.d.ts:717

▸ **save**(`options?`, `fn?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `SaveOptions` |
| `fn?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`void`

#### Inherited from

Document.save

#### Defined in

node_modules/mongoose/index.d.ts:718

▸ **save**(`fn?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn?` | `Callback`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |

#### Returns

`void`

#### Inherited from

Document.save

#### Defined in

node_modules/mongoose/index.d.ts:719

___

### set

▸ **set**(`path`, `val`, `options?`): `this`

Sets the value of a path, or many paths.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |
| `options?` | `any` |

#### Returns

`this`

#### Inherited from

Document.set

#### Defined in

node_modules/mongoose/index.d.ts:725

▸ **set**(`path`, `val`, `type`, `options?`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val` | `any` |
| `type` | `any` |
| `options?` | `any` |

#### Returns

`this`

#### Inherited from

Document.set

#### Defined in

node_modules/mongoose/index.d.ts:726

▸ **set**(`value`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |

#### Returns

`this`

#### Inherited from

Document.set

#### Defined in

node_modules/mongoose/index.d.ts:727

___

### toJSON

▸ **toJSON**(`options?`): `LeanDocument`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

The return value of this method is used in calls to JSON.stringify(doc).

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `ToObjectOptions` |

#### Returns

`LeanDocument`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.toJSON

#### Defined in

node_modules/mongoose/index.d.ts:730

▸ **toJSON**\<`T`\>(`options?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `ToObjectOptions` |

#### Returns

`T`

#### Inherited from

Document.toJSON

#### Defined in

node_modules/mongoose/index.d.ts:731

___

### toObject

▸ **toObject**(`options?`): `LeanDocument`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Converts this document into a plain-old JavaScript object ([POJO](https://masteringjs.io/tutorials/fundamentals/pojo)).

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `ToObjectOptions` |

#### Returns

`LeanDocument`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.toObject

#### Defined in

node_modules/mongoose/index.d.ts:734

▸ **toObject**\<`T`\>(`options?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `ToObjectOptions` |

#### Returns

`T`

#### Inherited from

Document.toObject

#### Defined in

node_modules/mongoose/index.d.ts:735

___

### unmarkModified

▸ **unmarkModified**(`path`): `void`

Clears the modified state on the specified path.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`void`

#### Inherited from

Document.unmarkModified

#### Defined in

node_modules/mongoose/index.d.ts:738

___

### update

▸ **update**(`update?`, `options?`, `callback?`): `Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Sends an update command with this document `_id` as the query selector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.update

#### Defined in

node_modules/mongoose/index.d.ts:741

___

### updateOne

▸ **updateOne**(`update?`, `options?`, `callback?`): `Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

Sends an updateOne command with this document `_id` as the query selector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `update?` | `UpdateWithAggregationPipeline` \| `UpdateQuery`\<[`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\> |
| `options?` | ``null`` \| `QueryOptions` |
| `callback?` | `Callback`\<`any`\> |

#### Returns

`Query`\<`any`, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md), \{\}, [`InterfaceLoggableDocument`](libraries_dbLogger.InterfaceLoggableDocument.md)\>

#### Inherited from

Document.updateOne

#### Defined in

node_modules/mongoose/index.d.ts:744

___

### validate

▸ **validate**(`options`): `Promise`\<`void`\>

Executes registered validation rules for this document.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.pathsToSkip?` | `pathsToSkip` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

Document.validate

#### Defined in

node_modules/mongoose/index.d.ts:747

▸ **validate**(`pathsToValidate?`, `options?`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathsToValidate?` | `pathsToValidate` |
| `options?` | `any` |

#### Returns

`Promise`\<`void`\>

#### Inherited from

Document.validate

#### Defined in

node_modules/mongoose/index.d.ts:748

▸ **validate**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Document.validate

#### Defined in

node_modules/mongoose/index.d.ts:749

▸ **validate**(`pathsToValidate`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathsToValidate` | `pathsToValidate` |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Document.validate

#### Defined in

node_modules/mongoose/index.d.ts:750

▸ **validate**(`pathsToValidate`, `options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathsToValidate` | `pathsToValidate` |
| `options` | `any` |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Document.validate

#### Defined in

node_modules/mongoose/index.d.ts:751

___

### validateSync

▸ **validateSync**(`options`): ``null`` \| `ValidationError`

Executes registered validation rules (skipping asynchronous validators) for this document.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.pathsToSkip?` | `pathsToSkip` |

#### Returns

``null`` \| `ValidationError`

#### Inherited from

Document.validateSync

#### Defined in

node_modules/mongoose/index.d.ts:754

▸ **validateSync**(`pathsToValidate?`, `options?`): ``null`` \| `ValidationError`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pathsToValidate?` | `string`[] |
| `options?` | `any` |

#### Returns

``null`` \| `ValidationError`

#### Inherited from

Document.validateSync

#### Defined in

node_modules/mongoose/index.d.ts:755
