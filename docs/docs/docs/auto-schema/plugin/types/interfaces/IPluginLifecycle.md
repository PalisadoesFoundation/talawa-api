[Admin Docs](/)

***

# Interface: IPluginLifecycle

Defined in: [src/plugin/types.ts:121](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L121)

## Methods

### onActivate()?

> `optional` **onActivate**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:123](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L123)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onDeactivate()?

> `optional` **onDeactivate**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:124](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L124)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onLoad()?

> `optional` **onLoad**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:122](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L122)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUnload()?

> `optional` **onUnload**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:125](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L125)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>
