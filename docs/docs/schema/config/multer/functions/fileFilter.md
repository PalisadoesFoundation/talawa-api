[Admin Docs](/)

***

# Function: fileFilter()

> **fileFilter**(`req`, `file`, `cb`): `void`

File filter function for multer.

This function checks the MIME type of the uploaded file against allowed image and video types.
If the file type is valid, it calls the callback with `true`. Otherwise, it calls the callback
with an error message.

## Parameters

### req

`Request`

The Express request object.

### file

`File`

The file being uploaded.

### cb

`FileFilterCallback`

The callback function to indicate if the file is accepted or rejected.

## Returns

`void`

## Example

```typescript
fileFilter(req, file, cb);
```

## Defined in

[src/config/multer/index.ts:27](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/config/multer/index.ts#L27)
