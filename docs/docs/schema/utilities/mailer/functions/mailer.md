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

[src/utilities/mailer.ts:27](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/mailer.ts#L27)
