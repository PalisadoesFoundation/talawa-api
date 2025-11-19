[API Docs](/)

***

# Class: EmailService

Defined in: src/services/ses/EmailService.ts:34

Simple email service using AWS SES

## Constructors

### Constructor

> **new EmailService**(`config`): `EmailService`

Defined in: src/services/ses/EmailService.ts:41

#### Parameters

##### config

[`EmailConfig`](../interfaces/EmailConfig.md)

#### Returns

`EmailService`

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

Defined in: src/services/ses/EmailService.ts:107

Send multiple emails

#### Parameters

##### jobs

[`EmailJob`](../interfaces/EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>

Defined in: src/services/ses/EmailService.ts:74

Send a single email using AWS SES

#### Parameters

##### job

[`EmailJob`](../interfaces/EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](../interfaces/EmailResult.md)\>
