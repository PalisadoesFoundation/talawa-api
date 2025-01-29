[Admin Docs](/)

***

# Function: reuploadDuplicateCheck()

> **reuploadDuplicateCheck**(`oldImagePath`, `newImagePath`): `Promise`\<`boolean`\>

Checks if a user or organization is attempting to re-upload the same image.

## Parameters

### oldImagePath

[`TypeImagePath`](../type-aliases/TypeImagePath.md)

Path of the current image (could be a string, URL request object, or buffer object).

### newImagePath

[`TypeImagePath`](../type-aliases/TypeImagePath.md)

Path of the new image being uploaded (could be a string, URL request object, or buffer object).

## Returns

`Promise`\<`boolean`\>

Promise that resolves to true if the images are identical, false otherwise.

## Remarks

This is a utility method.

## Defined in

[src/utilities/reuploadDuplicateCheck.ts:48](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/reuploadDuplicateCheck.ts#L48)
