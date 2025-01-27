[**talawa-api**](../../../README.md)

***

# Function: mailer()

> **mailer**(`mailFields`): `Promise`\<`string` \| `SentMessageInfo`\>

Sends an email using Nodemailer.

## Parameters

### mailFields

[`InterfaceMailFields`](../interfaces/InterfaceMailFields.md)

An object containing emailTo, subject, and body fields.

## Returns

`Promise`\<`string` \| `SentMessageInfo`\>

A promise resolving to `SMTPTransport.SentMessageInfo` on success, or an error string on failure.

## Remarks

This is a utility method for sending emails.

## Defined in

[src/utilities/mailer.ts:27](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/mailer.ts#L27)
