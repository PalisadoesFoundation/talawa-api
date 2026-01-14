[**talawa-api**](../../../README.md)

***

# Interface: IPluginLifecycle

Defined in: [src/plugin/types.ts:145](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L145)

## Methods

### onActivate()?

> `optional` **onActivate**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:148](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L148)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onDeactivate()?

> `optional` **onDeactivate**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:149](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L149)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onInstall()?

> `optional` **onInstall**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:146](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L146)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onLoad()?

> `optional` **onLoad**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:147](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L147)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUninstall()?

> `optional` **onUninstall**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:150](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L150)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUnload()?

> `optional` **onUnload**(`context`): `Promise`\<`void`\>

Defined in: [src/plugin/types.ts:151](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L151)

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>
