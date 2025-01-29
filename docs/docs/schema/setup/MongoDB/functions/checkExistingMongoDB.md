[**talawa-api**](../../../README.md)

***

# Function: checkExistingMongoDB()

> **checkExistingMongoDB**(): `Promise`\<`string` \| `null`\>

The `checkExistingMongoDB` function checks for an existing MongoDB URL in the environment variables and attempts to establish a connection.

It performs the following steps:
1. Retrieves the MongoDB URL from the environment variables.
2. If no URL is found, it immediately returns null.
3. If a URL is found, it attempts to establish a connection using the `checkConnection` function.
   - If the connection is successful (i.e., `checkConnection` returns true), it returns the URL.
   - If the connection fails (i.e., `checkConnection` returns false), it returns null.

This function is used during the initial setup process to check if a valid MongoDB connection can be made with the existing URL in the environment variables.

## Returns

`Promise`\<`string` \| `null`\>

A promise that resolves to a string (if a connection could be made to the existing URL) or null (if no existing URL or connection could not be made).

## Defined in

[src/setup/MongoDB.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/setup/MongoDB.ts#L17)
