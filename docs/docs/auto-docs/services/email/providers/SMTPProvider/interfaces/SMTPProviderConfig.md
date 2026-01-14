[API Docs](/)

***

# Interface: SMTPProviderConfig

Defined in: [src/services/email/providers/SMTPProvider.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L11)

Configuration for SMTP Email Provider.

## Properties

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L23)

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:25](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L25)

Default sender display name.

***

### host

> **host**: [`NonEmptyString`](../../../types/type-aliases/NonEmptyString.md)

Defined in: [src/services/email/providers/SMTPProvider.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L13)

SMTP server hostname. Required.

***

### password?

> `optional` **password**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L19)

SMTP password for authentication. Optional.

***

### port

> **port**: `number`

Defined in: [src/services/email/providers/SMTPProvider.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L15)

SMTP server port. Required.

***

### secure?

> `optional` **secure**: `boolean`

Defined in: [src/services/email/providers/SMTPProvider.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L21)

Whether to use SSL/TLS (true for port 465, false for port 587 with STARTTLS).

***

### user?

> `optional` **user**: `string`

Defined in: [src/services/email/providers/SMTPProvider.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/email/providers/SMTPProvider.ts#L17)

SMTP username for authentication. Optional.
