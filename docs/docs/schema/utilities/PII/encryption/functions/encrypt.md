[**talawa-api**](../../../../README.md)

***

# Function: encrypt()

> **encrypt**(`text`, `key`, `iv`): `string`

Encrypts plaintext using AES-256-CBC encryption.

## Parameters

### text

`string`

The plaintext to encrypt.

### key

`string`

The encryption key as a string.

### iv

`string`

The initialization vector (IV) as a string in hexadecimal format.

## Returns

`string`

The encrypted ciphertext as a hexadecimal string.

## Defined in

[src/utilities/PII/encryption.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/PII/encryption.ts#L10)
