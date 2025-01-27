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

[src/config/multer/index.ts:63](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/config/multer/index.ts#L63)
