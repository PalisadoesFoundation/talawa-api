[API Docs](/)

***

# Class: EmailQueueProcessor

Defined in: src/services/ses/EmailQueueProcessor.ts:11

Simple email queue processor that processes pending emails

## Constructors

### Constructor

> **new EmailQueueProcessor**(`emailService`, `ctx`): `EmailQueueProcessor`

Defined in: src/services/ses/EmailQueueProcessor.ts:17

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

Defined in: src/services/ses/EmailQueueProcessor.ts:28

Process pending emails from the queue

#### Returns

`Promise`\<`void`\>

***

### startBackgroundProcessing()

> **startBackgroundProcessing**(`intervalMs`): `void`

Defined in: src/services/ses/EmailQueueProcessor.ts:145

Start background processor - simple setInterval approach

#### Parameters

##### intervalMs

`number` = `30000`

#### Returns

`void`

***

### stopBackgroundProcessing()

> **stopBackgroundProcessing**(): `void`

Defined in: src/services/ses/EmailQueueProcessor.ts:157

#### Returns

`void`
