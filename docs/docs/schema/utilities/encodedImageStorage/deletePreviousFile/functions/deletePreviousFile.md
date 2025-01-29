[Admin Docs](/)

***

# Function: deletePreviousFile()

> **deletePreviousFile**(`fileId`, `objectKey`): `Promise`\<`void`\>

Deletes a file from the storage and database if its reference count is 1.
Otherwise, decrements the reference count in the database by 1.

## Parameters

### fileId

`string`

The ID of the file to be deleted or updated.

### objectKey

`string`

The object key in the storage bucket associated with the file.

## Returns

`Promise`\<`void`\>

A promise that resolves when the file is either deleted or its reference count is updated.

## Defined in

[src/utilities/encodedImageStorage/deletePreviousFile.ts:13](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/encodedImageStorage/deletePreviousFile.ts#L13)
