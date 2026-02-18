[API Docs](/)

***

# Function: UserCountryCodeResolver()

> **UserCountryCodeResolver**(`parent`, `_args`, `ctx`): `Promise`\<`"at"` \| `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`\>

Defined in: [src/graphql/types/User/countryCode.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/User/countryCode.ts#L23)

Resolver for the `countryCode` field of the `User` type.

This function retrieves the country code of a user. It enforces authorization rules:
- The user must be authenticated.
- The user must be the same as the parent user or an administrator.

## Parameters

### parent

The parent `User` object.

#### addressLine1

`string` \| `null`

#### addressLine2

`string` \| `null`

#### avatarMimeType

`string` \| `null`

#### avatarName

`string` \| `null`

#### birthDate

`Date` \| `null`

#### city

`string` \| `null`

#### countryCode

`string` \| `null`

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### description

`string` \| `null`

#### educationGrade

`string` \| `null`

#### emailAddress

`string`

#### employmentStatus

`string` \| `null`

#### failedLoginAttempts

`number`

#### homePhoneNumber

`string` \| `null`

#### id

`string`

#### isEmailAddressVerified

`boolean`

#### lastFailedLoginAt

`Date` \| `null`

#### lockedUntil

`Date` \| `null`

#### maritalStatus

`string` \| `null`

#### mobilePhoneNumber

`string` \| `null`

#### name

`string`

#### natalSex

`string` \| `null`

#### naturalLanguageCode

`string` \| `null`

#### passwordHash

`string`

#### postalCode

`string` \| `null`

#### role

`string`

#### state

`string` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

#### workPhoneNumber

`string` \| `null`

### \_args

`unknown`

The arguments for the field (unused).

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

The GraphQL context containing the current client and Drizzle client.

## Returns

`Promise`\<`"at"` \| `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`\>

The ISO 3166 Alpha-2 country code of the user, or null.

## Throws

if the user is unauthenticated or unauthorized.
