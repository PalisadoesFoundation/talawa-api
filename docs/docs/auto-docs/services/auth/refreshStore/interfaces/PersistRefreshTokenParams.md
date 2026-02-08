[API Docs](/)

***

# Interface: PersistRefreshTokenParams

Defined in: [src/services/auth/refreshStore.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L26)

Parameters for persisting a refresh token.
- token: raw refresh token (hashed before storage).
- userId: user ID to associate with the token.
- ttlSec: time-to-live in seconds; must be greater than 0.
- ip, userAgent: accepted but not persisted (no table columns); deprecated for future use.

## Properties

### ~~ip?~~

> `optional` **ip**: `string`

Defined in: [src/services/auth/refreshStore.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L30)

#### Deprecated

Not stored; table has no ip column. Kept for API compatibility.

***

### token

> **token**: `string`

Defined in: [src/services/auth/refreshStore.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L27)

***

### ttlSec

> **ttlSec**: `number`

Defined in: [src/services/auth/refreshStore.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L33)

***

### ~~userAgent?~~

> `optional` **userAgent**: `string`

Defined in: [src/services/auth/refreshStore.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L32)

#### Deprecated

Not stored; table has no userAgent column. Kept for API compatibility.

***

### userId

> **userId**: `string`

Defined in: [src/services/auth/refreshStore.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L28)
