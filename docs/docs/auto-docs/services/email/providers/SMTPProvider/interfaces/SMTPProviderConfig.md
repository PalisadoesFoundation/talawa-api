[API Docs](/)

***

# Interface: SMTPProviderConfig

Defined in: [src/services/email/providers/SMTPProvider.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L14)

Configuration for SMTP Email Provider.

## Properties

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L26)

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L28)

Default sender display name.

***

### host

> **host**: [`NonEmptyString`](../../../types/type-aliases/NonEmptyString.md)

Defined in: [src/services/email/providers/SMTPProvider.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L16)

SMTP server hostname. Required.

***

### localAddress?

> `optional` **localAddress**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L32)

Local IP address to bind to for outgoing SMTP connections.

***

### name?

> `optional` **name**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L30)

Client hostname to greet the SMTP server with.

***

### password?

> `optional` **password**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L22)

SMTP password for authentication. Optional.

***

### port

> **port**: `number`

Defined in: [src/services/email/providers/SMTPProvider.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L18)

SMTP server port. Required.

***

### secure?

> `optional` **secure**: `boolean`

Defined in: [src/services/email/providers/SMTPProvider.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L24)

Whether to use SSL/TLS (true for port 465, false for port 587 with STARTTLS).

***

### user?

> `optional` **user**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L20)

SMTP username for authentication. Optional.
