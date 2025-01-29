[**talawa-api**](../../../README.md)

***

# Variable: upload

> `const` **upload**: `Multer`

Multer upload configuration.

This configuration sets up multer to use memory storage, applies the file filter,
and sets a file size limit for uploads.

## Returns

A multer instance configured for handling uploads.

## Example

```typescript
const uploadMiddleware = upload.single("file");
app.post("/upload", uploadMiddleware, (req, res) => {
  res.send("File uploaded successfully!");
});
```

## Defined in

[src/config/multer/index.ts:63](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/config/multer/index.ts#L63)
