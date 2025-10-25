[Admin Docs](/)

***

# Class: EmailQueueProcessor

Defined in: [src/services/ses/EmailQueueProcessor.ts:11](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/ses/EmailQueueProcessor.ts#L11)

Simple email queue processor that processes pending emails

## Constructors

### Constructor

> **new EmailQueueProcessor**(`emailService`, `ctx`): `EmailQueueProcessor`

Defined in: [src/services/ses/EmailQueueProcessor.ts:17](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/ses/EmailQueueProcessor.ts#L17)

#### Parameters

##### emailService

[`EmailService`](../../EmailService/classes/EmailService.md)

##### ctx

`Pick`\<[`GraphQLContext`](../../../../graphql/context/type-aliases/GraphQLContext.md), `"drizzleClient"` \| `"log"`\>

#### Returns

`EmailQueueProcessor`

## Methods

### processPendingEmails()

> **processPendingEmails**(): `Promise`\<`void`\>

Defined in: [src/services/ses/EmailQueueProcessor.ts:28](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/ses/EmailQueueProcessor.ts#L28)

Process pending emails from the queue

#### Returns

`Promise`\<`void`\>

***

### startBackgroundProcessing()

> **startBackgroundProcessing**(`intervalMs`): `void`

Defined in: [src/services/ses/EmailQueueProcessor.ts:125](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/ses/EmailQueueProcessor.ts#L125)

Start background processor - simple setInterval approach

#### Parameters

##### intervalMs

`number` = `30000`

#### Returns

`void`

***

### stopBackgroundProcessing()

> **stopBackgroundProcessing**(): `void`

Defined in: [src/services/ses/EmailQueueProcessor.ts:137](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/services/ses/EmailQueueProcessor.ts#L137)

#### Returns

`void`
