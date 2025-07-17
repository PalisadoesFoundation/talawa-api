[Admin Docs](/)

***

# Interface: IDatabaseClient

Defined in: [src/plugin/types.ts:198](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L198)

## Properties

### execute()?

> `optional` **execute**: (`sql`) => `Promise`\<`unknown`\>

Defined in: [src/plugin/types.ts:210](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L210)

#### Parameters

##### sql

`string`

#### Returns

`Promise`\<`unknown`\>

***

### select()

> **select**: (...`args`) => `object`

Defined in: [src/plugin/types.ts:199](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L199)

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

Defined in: [src/plugin/types.ts:205](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L205)

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
