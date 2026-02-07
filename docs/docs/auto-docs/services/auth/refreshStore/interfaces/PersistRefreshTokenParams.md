[API Docs](/)

***

# Interface: PersistRefreshTokenParams

Defined in: [src/services/auth/refreshStore.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L18)

Parameters for persisting a refresh token.
ip and userAgent are accepted for future compatibility but not persisted (table has no such columns).

## Properties

### ip?

> `optional` **ip**: `string`

Defined in: [src/services/auth/refreshStore.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L22)

Optional, not persisted in current schema

***

### token

> **token**: `string`

Defined in: [src/services/auth/refreshStore.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L19)

***

### ttlSec

> **ttlSec**: `number`

Defined in: [src/services/auth/refreshStore.ts:25](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L25)

***

### userAgent?

> `optional` **userAgent**: `string`

Defined in: [src/services/auth/refreshStore.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L24)

Optional, not persisted in current schema

***

### userId

> **userId**: `string`

Defined in: [src/services/auth/refreshStore.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L20)
