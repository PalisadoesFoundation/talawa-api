[API Docs](/)

***

# Type Alias: RateLimitCache

> **RateLimitCache** = `object`

Defined in: [src/utilities/passwordChangeRateLimit.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L14)

Minimal cache interface needed for rate limiting (compatible with ctx.cache).

## Methods

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `null`\>

Defined in: [src/utilities/passwordChangeRateLimit.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L15)

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

Defined in: [src/utilities/passwordChangeRateLimit.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L16)

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
