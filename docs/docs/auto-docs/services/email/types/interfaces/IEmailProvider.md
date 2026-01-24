[API Docs](/)

***

# Interface: IEmailProvider

Defined in: src/services/email/types.ts:31

Email provider interface

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](EmailResult.md)[]\>

Defined in: src/services/email/types.ts:33

#### Parameters

##### jobs

[`EmailJob`](EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](EmailResult.md)\>

Defined in: src/services/email/types.ts:32

#### Parameters

##### job

[`EmailJob`](EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](EmailResult.md)\>
