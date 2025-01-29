[Admin Docs](/)

***

# Variable: BUCKET\_NAME

> `const` **BUCKET\_NAME**: `string` = `process.env.MINIO_BUCKET`

The name of the bucket used in the MinIO storage, defined via an environment variable.

## Example

```typescript
console.log(BUCKET_NAME); // Logs the bucket name from the environment
```

## Returns

The name of the MinIO bucket.

## Defined in

[src/config/minio/index.ts:47](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/config/minio/index.ts#L47)
