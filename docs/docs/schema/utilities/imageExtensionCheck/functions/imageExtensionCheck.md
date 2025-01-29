[Admin Docs](/)

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

[src/utilities/imageExtensionCheck.ts:11](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/imageExtensionCheck.ts#L11)
