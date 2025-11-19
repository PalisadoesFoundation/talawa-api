[API Docs](/)

***

# Interface: IDatabaseClient

Defined in: src/plugin/types.ts:169

## Properties

### execute()?

> `optional` **execute**: (`sql`) => `Promise`\<`unknown`\>

Defined in: src/plugin/types.ts:181

#### Parameters

##### sql

`string`

#### Returns

`Promise`\<`unknown`\>

***

### select()

> **select**: (...`args`) => `object`

Defined in: src/plugin/types.ts:170

#### Parameters

##### args

...`unknown`[]

#### Returns

`object`

##### from()

> **from**: (`table`) => `object`

###### Parameters

###### table

`unknown`

###### Returns

`object`

###### limit()?

> `optional` **limit**: (...`args`) => `Promise`\<`unknown`[]\>

###### Parameters

###### args

...`unknown`[]

###### Returns

`Promise`\<`unknown`[]\>

###### where()

> **where**: (...`args`) => `Promise`\<`unknown`[]\>

###### Parameters

###### args

...`unknown`[]

###### Returns

`Promise`\<`unknown`[]\>

***

### update()

> **update**: (...`args`) => `object`

Defined in: src/plugin/types.ts:176

#### Parameters

##### args

...`unknown`[]

#### Returns

`object`

##### set()

> **set**: (...`args`) => `object`

###### Parameters

###### args

...`unknown`[]

###### Returns

`object`

###### where()

> **where**: (...`args`) => `Promise`\<`void`\>

###### Parameters

###### args

...`unknown`[]

###### Returns

`Promise`\<`void`\>
