[Admin Docs](/)

***

# Function: resolveCreatedOrganizations()

> **resolveCreatedOrganizations**(`parent`, `args`, `ctx`): `Promise`\<`object`[]\>

Defined in: [src/graphql/types/User/createdOrganizations.ts:17](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/User/createdOrganizations.ts#L17)

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

#### birthDate

`null` \| `Date`

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

#### educationGrade

`null` \| `"kg"` \| `"grade_1"` \| `"grade_2"` \| `"grade_3"` \| `"grade_4"` \| `"grade_5"` \| `"grade_6"` \| `"grade_7"` \| `"grade_8"` \| `"grade_9"` \| `"grade_10"` \| `"grade_11"` \| `"grade_12"` \| `"graduate"` \| `"no_grade"` \| `"pre_kg"`

#### emailAddress

`string`

#### employmentStatus

`null` \| `"full_time"` \| `"part_time"` \| `"unemployed"`

#### homePhoneNumber

`null` \| `string`

#### id

`string`

#### isEmailAddressVerified

`boolean`

#### maritalStatus

`null` \| `"divorced"` \| `"engaged"` \| `"married"` \| `"seperated"` \| `"single"` \| `"widowed"`

#### mobilePhoneNumber

`null` \| `string`

#### name

`string`

#### natalSex

`null` \| `"female"` \| `"intersex"` \| `"male"`

#### naturalLanguageCode

`null` \| `"aa"` \| `"ab"` \| `"ae"` \| `"af"` \| `"ak"` \| `"am"` \| `"an"` \| `"ar"` \| `"as"` \| `"av"` \| `"ay"` \| `"az"` \| `"ba"` \| `"be"` \| `"bg"` \| `"bi"` \| `"bm"` \| `"bn"` \| `"bo"` \| `"br"` \| `"bs"` \| `"ca"` \| `"ce"` \| `"ch"` \| `"co"` \| `"cr"` \| `"cs"` \| `"cu"` \| `"cv"` \| `"cy"` \| `"da"` \| `"de"` \| `"dv"` \| `"dz"` \| `"ee"` \| `"el"` \| `"en"` \| `"eo"` \| `"es"` \| `"et"` \| `"eu"` \| `"fa"` \| `"ff"` \| `"fi"` \| `"fj"` \| `"fo"` \| `"fr"` \| `"fy"` \| `"ga"` \| `"gd"` \| `"gl"` \| `"gn"` \| `"gu"` \| `"gv"` \| `"ha"` \| `"he"` \| `"hi"` \| `"ho"` \| `"hr"` \| `"ht"` \| `"hu"` \| `"hy"` \| `"hz"` \| `"ia"` \| `"id"` \| `"ie"` \| `"ig"` \| `"ii"` \| `"ik"` \| `"io"` \| `"is"` \| `"it"` \| `"iu"` \| `"ja"` \| `"jv"` \| `"ka"` \| `"kg"` \| `"ki"` \| `"kj"` \| `"kk"` \| `"kl"` \| `"km"` \| `"kn"` \| `"ko"` \| `"kr"` \| `"ks"` \| `"ku"` \| `"kv"` \| `"kw"` \| `"ky"` \| `"la"` \| `"lb"` \| `"lg"` \| `"li"` \| `"ln"` \| `"lo"` \| `"lt"` \| `"lu"` \| `"lv"` \| `"mg"` \| `"mh"` \| `"mi"` \| `"mk"` \| `"ml"` \| `"mn"` \| `"mr"` \| `"ms"` \| `"mt"` \| `"my"` \| `"na"` \| `"nb"` \| `"nd"` \| `"ne"` \| `"ng"` \| `"nl"` \| `"nn"` \| `"no"` \| `"nr"` \| `"nv"` \| `"ny"` \| `"oc"` \| `"oj"` \| `"om"` \| `"or"` \| `"os"` \| `"pa"` \| `"pi"` \| `"pl"` \| `"ps"` \| `"pt"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"ro"` \| `"ru"` \| `"rw"` \| `"sa"` \| `"sc"` \| `"sd"` \| `"se"` \| `"sg"` \| `"si"` \| `"sk"` \| `"sl"` \| `"sm"` \| `"sn"` \| `"so"` \| `"sq"` \| `"sr"` \| `"ss"` \| `"st"` \| `"su"` \| `"sv"` \| `"sw"` \| `"ta"` \| `"te"` \| `"tg"` \| `"th"` \| `"ti"` \| `"tk"` \| `"tl"` \| `"tn"` \| `"to"` \| `"tr"` \| `"ts"` \| `"tt"` \| `"tw"` \| `"ty"` \| `"ug"` \| `"uk"` \| `"ur"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"vo"` \| `"wa"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"za"` \| `"zh"` \| `"zu"`

#### passwordHash

`string`

#### postalCode

`null` \| `string`

#### role

`"administrator"` \| `"regular"`

#### state

`null` \| `string`

#### updatedAt

`null` \| `Date`

#### updaterId

`null` \| `string`

#### workPhoneNumber

`null` \| `string`

### args

`CreatedOrganizationsArgs`

### ctx

`ContextType`

## Returns

`Promise`\<`object`[]\>
