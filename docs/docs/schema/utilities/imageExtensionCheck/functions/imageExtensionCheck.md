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

[src/utilities/imageExtensionCheck.ts:11](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/imageExtensionCheck.ts#L11)
