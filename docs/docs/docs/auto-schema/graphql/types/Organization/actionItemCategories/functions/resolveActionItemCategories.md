[Admin Docs](/)

***

# Function: resolveActionItemCategories()

> **resolveActionItemCategories**(`parent`, `args`, `ctx`): `Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `id`: `string`; `isDisabled`: `boolean`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>

Defined in: [src/graphql/types/Organization/actionItemCategories.ts:56](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/types/Organization/actionItemCategories.ts#L56)

## Parameters

### parent

#### addressLine1

`null` \| `string`

#### addressLine2

`null` \| `string`

#### avatarMimeType

`null` \| `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"`

#### avatarName

`null` \| `string`

#### city

`null` \| `string`

#### countryCode

`null` \| `"ae"` \| `"af"` \| `"am"` \| `"ar"` \| `"as"` \| `"az"` \| `"ba"` \| `"be"` \| `"bg"` \| `"bi"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"br"` \| `"bs"` \| `"ca"` \| `"ch"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cy"` \| `"de"` \| `"dz"` \| `"ee"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gd"` \| `"gl"` \| `"gn"` \| `"gu"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"io"` \| `"is"` \| `"it"` \| `"kg"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"la"` \| `"lb"` \| `"li"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mn"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"my"` \| `"na"` \| `"ne"` \| `"ng"` \| `"nl"` \| `"no"` \| `"nr"` \| `"om"` \| `"pa"` \| `"pl"` \| `"ps"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"si"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"tg"` \| `"th"` \| `"tk"` \| `"tl"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tw"` \| `"ug"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"za"` \| `"ad"` \| `"ag"` \| `"ai"` \| `"al"` \| `"ao"` \| `"aq"` \| `"at"` \| `"au"` \| `"aw"` \| `"ax"` \| `"bb"` \| `"bd"` \| `"bf"` \| `"bh"` \| `"bj"` \| `"bl"` \| `"bq"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"cw"` \| `"cx"` \| `"cz"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"ec"` \| `"eg"` \| `"eh"` \| `"er"` \| `"fk"` \| `"fm"` \| `"gb"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gm"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"il"` \| `"im"` \| `"in"` \| `"iq"` \| `"ir"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kh"` \| `"kp"` \| `"kz"` \| `"lc"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mm"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"mz"` \| `"nc"` \| `"nf"` \| `"ni"` \| `"np"` \| `"nu"` \| `"nz"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"rs"` \| `"sb"` \| `"sh"` \| `"sj"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tj"` \| `"tm"` \| `"tv"` \| `"tz"` \| `"ua"` \| `"um"` \| `"us"` \| `"uy"` \| `"va"` \| `"vc"` \| `"vg"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"zm"` \| `"zw"`

#### createdAt

`Date`

#### creatorId

`null` \| `string`

#### description

`null` \| `string`

#### id

`string`

#### name

`string`

#### postalCode

`null` \| `string`

#### state

`null` \| `string`

#### updatedAt

`null` \| `Date`

#### updaterId

`null` \| `string`

#### userRegistrationRequired

`null` \| `boolean`

### args

#### after?

`null` \| `string` = `...`

#### before?

`null` \| `string` = `...`

#### first?

`null` \| `number` = `...`

#### last?

`null` \| `number` = `...`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<[`DefaultGraphQLConnection`](../../../../../utilities/defaultGraphQLConnection/type-aliases/DefaultGraphQLConnection.md)\<\{ `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `id`: `string`; `isDisabled`: `boolean`; `name`: `string`; `organizationId`: `string`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; \}\>\>
