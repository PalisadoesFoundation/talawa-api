[API Docs](/)

***

# Interface: IPluginLifecycle

Defined in: src/plugin/types.ts:145

## Methods

### onActivate()?

> `optional` **onActivate**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:148

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onDeactivate()?

> `optional` **onDeactivate**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:149

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onInstall()?

> `optional` **onInstall**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:146

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onLoad()?

> `optional` **onLoad**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:147

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUninstall()?

> `optional` **onUninstall**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:150

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUnload()?

> `optional` **onUnload**(`context`): `Promise`\<`void`\>

Defined in: src/plugin/types.ts:151

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>
