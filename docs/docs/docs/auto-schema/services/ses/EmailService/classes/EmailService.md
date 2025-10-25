[Admin Docs](/)

***

# Class: EmailService

Defined in: [src/services/ses/EmailService.ts:34](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/ses/EmailService.ts#L34)

Simple email service using AWS SES

## Constructors

### Constructor

> **new EmailService**(`config`): `EmailService`

Defined in: [src/services/ses/EmailService.ts:41](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/ses/EmailService.ts#L41)

#### Parameters

##### config

[`EmailConfig`](../interfaces/EmailConfig.md)

#### Returns

`EmailService`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

Defined in: [src/services/ses/EmailService.ts:107](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/ses/EmailService.ts#L107)

Send multiple emails

#### Parameters

##### jobs

[`EmailJob`](../interfaces/EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>

Defined in: [src/services/ses/EmailService.ts:74](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/ses/EmailService.ts#L74)

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>
