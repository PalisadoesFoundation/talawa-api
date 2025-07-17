[Admin Docs](/)

***

# Function: validateWindowConfig()

> **validateWindowConfig**(`config`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:292](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/windowManager.ts#L292)

Validates the configuration of a window manager to ensure all properties are within
acceptable ranges and formats.

## Parameters

### config

[`WindowManagerConfig`](../../types/interfaces/WindowManagerConfig.md)

The window manager configuration object to validate.

## Returns

`boolean`

`true` if the configuration is valid, otherwise `false`.
