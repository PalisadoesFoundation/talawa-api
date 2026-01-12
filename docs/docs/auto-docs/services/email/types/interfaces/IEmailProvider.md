[API Docs](/)

***

# Interface: IEmailProvider

Defined in: [src/services/email/types.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/types.ts#L26)

Email provider interface

## Methods

### sendBulkEmails()

> **sendBulkEmails**(`jobs`): `Promise`\<[`EmailResult`](EmailResult.md)[]\>

Defined in: [src/services/email/types.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/types.ts#L28)

#### Parameters

##### jobs

[`EmailJob`](EmailJob.md)[]

#### Returns

`Promise`\<[`EmailResult`](EmailResult.md)[]\>

***

### sendEmail()

> **sendEmail**(`job`): `Promise`\<[`EmailResult`](EmailResult.md)\>

Defined in: [src/services/email/types.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/types.ts#L27)

#### Parameters

##### job

[`EmailJob`](EmailJob.md)

#### Returns

`Promise`\<[`EmailResult`](EmailResult.md)\>
