[Admin Docs](/)

***

# Function: verifySmtpConnection()

> **verifySmtpConnection**(`config`): `Promise`\<`VerifySmtpConnectionReturnType`\>

The function `verifySmtpConnection` verifies the SMTP connection using the provided configuration
and returns a success status and error message if applicable.

## Parameters

### config

`Record`\<`string`, `string`\>

The `config` parameter is an object that contains the configuration settings for the
SMTP connection. It should have the following properties:

## Returns

`Promise`\<`VerifySmtpConnectionReturnType`\>

The function `verifySmtpConnection` returns a Promise that resolves to an object of type
`VerifySmtpConnectionReturnType`. The `VerifySmtpConnectionReturnType` object has two properties:
`success` and `error`. If the SMTP connection is verified successfully, the `success` property will
be `true` and the `error` property will be `null`. If the SMTP connection verification fails

## Defined in

[src/setup/verifySmtpConnection.ts:18](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/setup/verifySmtpConnection.ts#L18)
