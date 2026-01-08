[API Docs](/)

***

# Function: resolveEventOrganization()

> **resolveEventOrganization**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"at"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

Defined in: [src/graphql/types/Event/organization.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Event/organization.ts#L18)

Resolves the organization that an event belongs to.

## Parameters

### parent

[`Event`](../../Event/type-aliases/Event.md)

The parent Event object containing the organizationId.

### \_args

`Record`\<`string`, `never`\>

GraphQL arguments (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing dataloaders and logging utilities.

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `city`: `string` \| `null`; `countryCode`: `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"at"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `id`: `string`; `name`: `string`; `postalCode`: `string` \| `null`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `userRegistrationRequired`: `boolean` \| `null`; \}\>

The organization the event belongs to.

## Throws

TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
