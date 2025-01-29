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

[src/utilities/mailer.ts:27](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/mailer.ts#L27)
