[API Docs](/)

***

# Interface: SMTPProviderConfig

Defined in: src/services/email/providers/SMTPProvider.ts:11

Configuration for SMTP Email Provider.

## Properties

### fromEmail?

> `optional` **fromEmail**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:23

Default sender email address.

***

### fromName?

> `optional` **fromName**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:25

Default sender display name.

***

### host

> **host**: [`NonEmptyString`](../../../types/type-aliases/NonEmptyString.md)

Defined in: src/services/email/providers/SMTPProvider.ts:13

SMTP server hostname. Required.

***

### localAddress?

> `optional` **localAddress**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:29

Local IP address to bind to for outgoing SMTP connections.

***

### name?

> `optional` **name**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:27

Client hostname to greet the SMTP server with.

***

### password?

> `optional` **password**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:19

SMTP password for authentication. Optional.

***

### port

> **port**: `number`

Defined in: src/services/email/providers/SMTPProvider.ts:15

SMTP server port. Required.

***

### secure?

> `optional` **secure**: `boolean`

Defined in: src/services/email/providers/SMTPProvider.ts:21

Whether to use SSL/TLS (true for port 465, false for port 587 with STARTTLS).

***

### user?

> `optional` **user**: `string`

Defined in: src/services/email/providers/SMTPProvider.ts:17

SMTP username for authentication. Optional.
