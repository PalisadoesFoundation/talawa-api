[**talawa-api**](../../../README.md)

***

# Function: imageExtensionCheck()

> **imageExtensionCheck**(`filename`): `Promise`\<`void`\>

Checks the file extension of the given filename.
If the extension is not 'png', 'jpg', or 'jpeg', deletes the file and throws a validation error.

## Parameters

### filename

`string`

The name of the file to check

## Returns

`Promise`\<`void`\>

## Defined in

[src/utilities/imageExtensionCheck.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/imageExtensionCheck.ts#L11)
