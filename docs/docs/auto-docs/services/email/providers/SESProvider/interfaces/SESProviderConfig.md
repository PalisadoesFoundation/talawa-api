[API Docs](/)

***

# Interface: SESProviderConfig

Defined in: [src/services/email/providers/SESProvider.ts:9](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L9)

Configuration for AWS SES Email Provider.

## Properties

### accessKeyId?

> `optional` **accessKeyId**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L13)

AWS Access Key ID. Optional if using default credential chain (e.g. IAM roles).

***

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L17)

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L19)

Default sender display name.

***

### region

> **region**: [`NonEmptyString`](../type-aliases/NonEmptyString.md)

Defined in: [src/services/email/providers/SESProvider.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L11)

AWS region (e.g., 'us-east-1'). Required.

***

### secretAccessKey?

> `optional` **secretAccessKey**: `string`

Defined in: [src/services/email/providers/SESProvider.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SESProvider.ts#L15)

AWS Secret Access Key. Optional if using default credential chain.
