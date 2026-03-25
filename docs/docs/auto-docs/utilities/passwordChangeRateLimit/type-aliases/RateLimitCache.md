[API Docs](/)

***

# Type Alias: RateLimitCache

> **RateLimitCache** = `object`

Defined in: [src/utilities/passwordChangeRateLimit.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L11)

Minimal cache interface needed for rate limiting (compatible with ctx.cache).

## Methods

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Defined in: [src/utilities/passwordChangeRateLimit.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L12)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`T` \| `null`\>

***

### set()

> **set**\<`T`\>(`key`, `value`, `ttlSeconds`): `Promise`\<`unknown`\>

Defined in: [src/utilities/passwordChangeRateLimit.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L13)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### ttlSeconds

`number`

#### Returns

`Promise`\<`unknown`\>
