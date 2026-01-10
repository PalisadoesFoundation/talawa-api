[API Docs](/)

***

# Function: resolveUpdater()

> **resolveUpdater**(`parent`, `_args`, `ctx`): `Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"at"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `"kg"` \| `"grade_1"` \| `"grade_2"` \| `"grade_3"` \| `"grade_4"` \| `"grade_5"` \| `"grade_6"` \| `"grade_7"` \| `"grade_8"` \| `"grade_9"` \| `"grade_10"` \| `"grade_11"` \| `"grade_12"` \| `"graduate"` \| `"no_grade"` \| `"pre_kg"` \| `null`; `emailAddress`: `string`; `employmentStatus`: `"full_time"` \| `"part_time"` \| `"unemployed"` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `"divorced"` \| `"engaged"` \| `"married"` \| `"seperated"` \| `"single"` \| `"widowed"` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `"female"` \| `"intersex"` \| `"male"` \| `null`; `naturalLanguageCode`: `"ae"` \| `"af"` \| `"am"` \| `"ar"` \| `"as"` \| `"az"` \| `"ba"` \| `"be"` \| `"bg"` \| `"bi"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"br"` \| `"bs"` \| `"ca"` \| `"ch"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cy"` \| `"de"` \| `"dz"` \| `"ee"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gd"` \| `"gl"` \| `"gn"` \| `"gu"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"io"` \| `"is"` \| `"it"` \| `"kg"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"la"` \| `"lb"` \| `"li"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mn"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"my"` \| `"na"` \| `"ne"` \| `"ng"` \| `"nl"` \| `"no"` \| `"nr"` \| `"om"` \| `"pa"` \| `"pl"` \| `"ps"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"si"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"tg"` \| `"th"` \| `"tk"` \| `"tl"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tw"` \| `"ug"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"za"` \| `"aa"` \| `"ab"` \| `"ak"` \| `"an"` \| `"av"` \| `"ay"` \| `"ce"` \| `"cs"` \| `"da"` \| `"dv"` \| `"el"` \| `"en"` \| `"eo"` \| `"eu"` \| `"fa"` \| `"ff"` \| `"fy"` \| `"gv"` \| `"ha"` \| `"he"` \| `"hi"` \| `"ho"` \| `"hy"` \| `"hz"` \| `"ia"` \| `"ig"` \| `"ii"` \| `"ik"` \| `"iu"` \| `"ja"` \| `"jv"` \| `"ka"` \| `"kj"` \| `"kk"` \| `"kl"` \| `"ko"` \| `"ks"` \| `"ku"` \| `"kv"` \| `"lg"` \| `"ln"` \| `"lo"` \| `"mi"` \| `"nb"` \| `"nd"` \| `"nn"` \| `"nv"` \| `"ny"` \| `"oc"` \| `"oj"` \| `"or"` \| `"os"` \| `"pi"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"sq"` \| `"su"` \| `"sw"` \| `"ta"` \| `"te"` \| `"ti"` \| `"ts"` \| `"ty"` \| `"uk"` \| `"ur"` \| `"vo"` \| `"wa"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"zh"` \| `"zu"` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `"administrator"` \| `"regular"`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>

Defined in: [src/graphql/types/AgendaFolder/updater.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/AgendaFolder/updater.ts#L8)

## Parameters

### parent

#### createdAt

`Date`

#### creatorId

`string` \| `null`

#### description

`string` \| `null`

#### eventId

`string`

#### id

`string`

#### isAgendaItemFolder

`boolean`

#### isDefaultFolder

`boolean`

#### name

`string`

#### organizationId

`string`

#### parentFolderId

`string` \| `null`

#### sequence

`number` \| `null`

#### updatedAt

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `addressLine1`: `string` \| `null`; `addressLine2`: `string` \| `null`; `avatarMimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `null`; `avatarName`: `string` \| `null`; `birthDate`: `Date` \| `null`; `city`: `string` \| `null`; `countryCode`: `"ad"` \| `"ae"` \| `"af"` \| `"ag"` \| `"ai"` \| `"al"` \| `"am"` \| `"ao"` \| `"aq"` \| `"ar"` \| `"as"` \| `"at"` \| `"au"` \| `"aw"` \| `"ax"` \| `"az"` \| `"ba"` \| `"bb"` \| `"bd"` \| `"be"` \| `"bf"` \| `"bg"` \| `"bh"` \| `"bi"` \| `"bj"` \| `"bl"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"bq"` \| `"br"` \| `"bs"` \| `"bt"` \| `"bv"` \| `"bw"` \| `"by"` \| `"bz"` \| `"ca"` \| `"cc"` \| `"cd"` \| `"cf"` \| `"cg"` \| `"ch"` \| `"ci"` \| `"ck"` \| `"cl"` \| `"cm"` \| `"cn"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cw"` \| `"cx"` \| `"cy"` \| `"cz"` \| `"de"` \| `"dj"` \| `"dk"` \| `"dm"` \| `"do"` \| `"dz"` \| `"ec"` \| `"ee"` \| `"eg"` \| `"eh"` \| `"er"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fk"` \| `"fm"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gb"` \| `"gd"` \| `"ge"` \| `"gf"` \| `"gg"` \| `"gh"` \| `"gi"` \| `"gl"` \| `"gm"` \| `"gn"` \| `"gp"` \| `"gq"` \| `"gr"` \| `"gs"` \| `"gt"` \| `"gu"` \| `"gw"` \| `"gy"` \| `"hk"` \| `"hm"` \| `"hn"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"il"` \| `"im"` \| `"in"` \| `"io"` \| `"iq"` \| `"ir"` \| `"is"` \| `"it"` \| `"je"` \| `"jm"` \| `"jo"` \| `"jp"` \| `"ke"` \| `"kg"` \| `"kh"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kp"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"kz"` \| `"la"` \| `"lb"` \| `"lc"` \| `"li"` \| `"lk"` \| `"lr"` \| `"ls"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"ly"` \| `"ma"` \| `"mc"` \| `"md"` \| `"me"` \| `"mf"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mm"` \| `"mn"` \| `"mo"` \| `"mp"` \| `"mq"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"mu"` \| `"mv"` \| `"mw"` \| `"mx"` \| `"my"` \| `"mz"` \| `"na"` \| `"nc"` \| `"ne"` \| `"nf"` \| `"ng"` \| `"ni"` \| `"nl"` \| `"no"` \| `"np"` \| `"nr"` \| `"nu"` \| `"nz"` \| `"om"` \| `"pa"` \| `"pe"` \| `"pf"` \| `"pg"` \| `"ph"` \| `"pk"` \| `"pl"` \| `"pm"` \| `"pn"` \| `"pr"` \| `"ps"` \| `"pt"` \| `"pw"` \| `"py"` \| `"qa"` \| `"re"` \| `"ro"` \| `"rs"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sb"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"sh"` \| `"si"` \| `"sj"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"sx"` \| `"sy"` \| `"sz"` \| `"tc"` \| `"td"` \| `"tf"` \| `"tg"` \| `"th"` \| `"tj"` \| `"tk"` \| `"tl"` \| `"tm"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tv"` \| `"tw"` \| `"tz"` \| `"ua"` \| `"ug"` \| `"um"` \| `"us"` \| `"uy"` \| `"uz"` \| `"va"` \| `"vc"` \| `"ve"` \| `"vg"` \| `"vi"` \| `"vn"` \| `"vu"` \| `"wf"` \| `"ws"` \| `"ye"` \| `"yt"` \| `"za"` \| `"zm"` \| `"zw"` \| `null`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `educationGrade`: `"kg"` \| `"grade_1"` \| `"grade_2"` \| `"grade_3"` \| `"grade_4"` \| `"grade_5"` \| `"grade_6"` \| `"grade_7"` \| `"grade_8"` \| `"grade_9"` \| `"grade_10"` \| `"grade_11"` \| `"grade_12"` \| `"graduate"` \| `"no_grade"` \| `"pre_kg"` \| `null`; `emailAddress`: `string`; `employmentStatus`: `"full_time"` \| `"part_time"` \| `"unemployed"` \| `null`; `failedLoginAttempts`: `number`; `homePhoneNumber`: `string` \| `null`; `id`: `string`; `isEmailAddressVerified`: `boolean`; `lastFailedLoginAt`: `Date` \| `null`; `lockedUntil`: `Date` \| `null`; `maritalStatus`: `"divorced"` \| `"engaged"` \| `"married"` \| `"seperated"` \| `"single"` \| `"widowed"` \| `null`; `mobilePhoneNumber`: `string` \| `null`; `name`: `string`; `natalSex`: `"female"` \| `"intersex"` \| `"male"` \| `null`; `naturalLanguageCode`: `"ae"` \| `"af"` \| `"am"` \| `"ar"` \| `"as"` \| `"az"` \| `"ba"` \| `"be"` \| `"bg"` \| `"bi"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"br"` \| `"bs"` \| `"ca"` \| `"ch"` \| `"co"` \| `"cr"` \| `"cu"` \| `"cv"` \| `"cy"` \| `"de"` \| `"dz"` \| `"ee"` \| `"es"` \| `"et"` \| `"fi"` \| `"fj"` \| `"fo"` \| `"fr"` \| `"ga"` \| `"gd"` \| `"gl"` \| `"gn"` \| `"gu"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"id"` \| `"ie"` \| `"io"` \| `"is"` \| `"it"` \| `"kg"` \| `"ki"` \| `"km"` \| `"kn"` \| `"kr"` \| `"kw"` \| `"ky"` \| `"la"` \| `"lb"` \| `"li"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"mg"` \| `"mh"` \| `"mk"` \| `"ml"` \| `"mn"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"my"` \| `"na"` \| `"ne"` \| `"ng"` \| `"nl"` \| `"no"` \| `"nr"` \| `"om"` \| `"pa"` \| `"pl"` \| `"ps"` \| `"pt"` \| `"ro"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"si"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sr"` \| `"ss"` \| `"st"` \| `"sv"` \| `"tg"` \| `"th"` \| `"tk"` \| `"tl"` \| `"tn"` \| `"to"` \| `"tr"` \| `"tt"` \| `"tw"` \| `"ug"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"za"` \| `"aa"` \| `"ab"` \| `"ak"` \| `"an"` \| `"av"` \| `"ay"` \| `"ce"` \| `"cs"` \| `"da"` \| `"dv"` \| `"el"` \| `"en"` \| `"eo"` \| `"eu"` \| `"fa"` \| `"ff"` \| `"fy"` \| `"gv"` \| `"ha"` \| `"he"` \| `"hi"` \| `"ho"` \| `"hy"` \| `"hz"` \| `"ia"` \| `"ig"` \| `"ii"` \| `"ik"` \| `"iu"` \| `"ja"` \| `"jv"` \| `"ka"` \| `"kj"` \| `"kk"` \| `"kl"` \| `"ko"` \| `"ks"` \| `"ku"` \| `"kv"` \| `"lg"` \| `"ln"` \| `"lo"` \| `"mi"` \| `"nb"` \| `"nd"` \| `"nn"` \| `"nv"` \| `"ny"` \| `"oc"` \| `"oj"` \| `"or"` \| `"os"` \| `"pi"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"sq"` \| `"su"` \| `"sw"` \| `"ta"` \| `"te"` \| `"ti"` \| `"ts"` \| `"ty"` \| `"uk"` \| `"ur"` \| `"vo"` \| `"wa"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"zh"` \| `"zu"` \| `null`; `passwordHash`: `string`; `postalCode`: `string` \| `null`; `role`: `"administrator"` \| `"regular"`; `state`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `workPhoneNumber`: `string` \| `null`; \} \| `null`\>
