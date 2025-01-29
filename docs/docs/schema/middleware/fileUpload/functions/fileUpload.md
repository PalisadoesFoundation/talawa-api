[**talawa-api**](../../../README.md)

***

# Function: fileUpload()

> **fileUpload**(`fieldName`): `RequestHandler`

A middleware for handling optional file uploads.
All data must be sent as multipart/form-data, but the file field is optional.

## Parameters

### fieldName

`string`

The name of the file field in the form

## Returns

`RequestHandler`

Express middleware for handling file upload

## Defined in

[src/middleware/fileUpload.ts:22](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/middleware/fileUpload.ts#L22)
