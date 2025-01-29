[**talawa-api**](../../../../README.md)

***

# Function: uploadEncodedVideo()

> **uploadEncodedVideo**(`encodedVideoURL`, `previousVideoPath`?): `Promise`\<`string`\>

Uploads an encoded video to the server.

## Parameters

### encodedVideoURL

`string`

The URL or content of the encoded video to upload.

### previousVideoPath?

`string`

Optional. The path of the previous video to delete before uploading the new one.

## Returns

`Promise`\<`string`\>

The file name of the uploaded video.

## Defined in

[src/utilities/encodedVideoStorage/uploadEncodedVideo.ts:19](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/encodedVideoStorage/uploadEncodedVideo.ts#L19)
