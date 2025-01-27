[**talawa-api**](../../../../README.md)

***

# Function: decrypt()

> **decrypt**(`encryptedText`, `key`, `iv`): `string`

Decrypts the given encrypted text using AES-256-CBC decryption.

## Parameters

### encryptedText

`string`

The encrypted text to decrypt, encoded as a hexadecimal string.

### key

`string`

The encryption key used for decryption.

### iv

`string`

The initialization vector (IV), used to ensure different ciphertexts encrypt to different ciphertexts even if the plaintexts are identical.

## Returns

`string`

The decrypted plaintext string.

## Defined in

[src/utilities/PII/decryption.ts:11](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/PII/decryption.ts#L11)
