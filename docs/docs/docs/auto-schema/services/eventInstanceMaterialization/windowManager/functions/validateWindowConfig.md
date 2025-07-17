[Admin Docs](/)

***

# Function: validateWindowConfig()

> **validateWindowConfig**(`config`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:292](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/windowManager.ts#L292)

Validates the configuration of a window manager to ensure all properties are within
acceptable ranges and formats.

## Parameters

### config

[`WindowManagerConfig`](../../types/interfaces/WindowManagerConfig.md)

The window manager configuration object to validate.

## Returns

`boolean`

`true` if the configuration is valid, otherwise `false`.
