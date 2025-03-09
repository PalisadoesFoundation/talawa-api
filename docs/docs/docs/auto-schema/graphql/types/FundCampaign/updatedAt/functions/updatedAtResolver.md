[Admin Docs](/)

***

# Function: updatedAtResolver()

> **updatedAtResolver**(`parent`, `args`, `ctx`): `Promise`\<`Date`\>

Defined in: [src/graphql/types/FundCampaign/updatedAt.ts:19](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/graphql/types/FundCampaign/updatedAt.ts#L19)

Resolver for the updatedAt field of FundCampaign type.
Validates user authentication and authorization before returning the last update timestamp.
Only administrators and organization admins have access to this field.

## Parameters

### parent

The parent FundCampaign object containing the updatedAt field

#### createdAt

`Date`

#### creatorId

`string`

#### currencyCode

`"AED"` \| `"AFN"` \| `"ALL"` \| `"AMD"` \| `"ANG"` \| `"AOA"` \| `"ARS"` \| `"AUD"` \| `"AWG"` \| `"AZN"` \| `"BAM"` \| `"BBD"` \| `"BDT"` \| `"BGN"` \| `"BHD"` \| `"BIF"` \| `"BMD"` \| `"BND"` \| `"BOB"` \| `"BOV"` \| `"BRL"` \| `"BSD"` \| `"BTN"` \| `"BWP"` \| `"BYN"` \| `"BZD"` \| `"CAD"` \| `"CDF"` \| `"CHE"` \| `"CHF"` \| `"CHW"` \| `"CLF"` \| `"CLP"` \| `"CNY"` \| `"COP"` \| `"COU"` \| `"CRC"` \| `"CUP"` \| `"CVE"` \| `"CZK"` \| `"DJF"` \| `"DKK"` \| `"DOP"` \| `"DZD"` \| `"EGP"` \| `"ERN"` \| `"ETB"` \| `"EUR"` \| `"FJD"` \| `"FKP"` \| `"GBP"` \| `"GEL"` \| `"GHS"` \| `"GIP"` \| `"GMD"` \| `"GNF"` \| `"GTQ"` \| `"GYD"` \| `"HKD"` \| `"HNL"` \| `"HTG"` \| `"HUF"` \| `"IDR"` \| `"ILS"` \| `"INR"` \| `"IQD"` \| `"IRR"` \| `"ISK"` \| `"JMD"` \| `"JOD"` \| `"JPY"` \| `"KES"` \| `"KGS"` \| `"KHR"` \| `"KMF"` \| `"KPW"` \| `"KRW"` \| `"KWD"` \| `"KYD"` \| `"KZT"` \| `"LAK"` \| `"LBP"` \| `"LKR"` \| `"LRD"` \| `"LSL"` \| `"LYD"` \| `"MAD"` \| `"MDL"` \| `"MGA"` \| `"MKD"` \| `"MMK"` \| `"MNT"` \| `"MOP"` \| `"MRU"` \| `"MUR"` \| `"MVR"` \| `"MWK"` \| `"MXN"` \| `"MXV"` \| `"MYR"` \| `"MZN"` \| `"NAD"` \| `"NGN"` \| `"NIO"` \| `"NOK"` \| `"NPR"` \| `"NZD"` \| `"OMR"` \| `"PAB"` \| `"PEN"` \| `"PGK"` \| `"PHP"` \| `"PKR"` \| `"PLN"` \| `"PYG"` \| `"QAR"` \| `"RON"` \| `"RSD"` \| `"RUB"` \| `"RWF"` \| `"SAR"` \| `"SBD"` \| `"SCR"` \| `"SDG"` \| `"SEK"` \| `"SGD"` \| `"SHP"` \| `"SLE"` \| `"SOS"` \| `"SRD"` \| `"SSP"` \| `"STN"` \| `"SVC"` \| `"SYP"` \| `"SZL"` \| `"THB"` \| `"TJS"` \| `"TMT"` \| `"TND"` \| `"TOP"` \| `"TRY"` \| `"TTD"` \| `"TWD"` \| `"TZS"` \| `"UAH"` \| `"UGX"` \| `"USD"` \| `"USN"` \| `"UYI"` \| `"UYU"` \| `"UYW"` \| `"UZS"` \| `"VED"` \| `"VES"` \| `"VND"` \| `"VUV"` \| `"WST"` \| `"XAF"` \| `"XAG"` \| `"XAU"` \| `"XBA"` \| `"XBB"` \| `"XBC"` \| `"XBD"` \| `"XCD"` \| `"XDR"` \| `"XOF"` \| `"XPD"` \| `"XPF"` \| `"XPT"` \| `"XSU"` \| `"XTS"` \| `"XUA"` \| `"XXX"` \| `"YER"` \| `"ZAR"` \| `"ZMW"` \| `"ZWG"`

#### endAt

`Date`

#### fundId

`string`

#### goalAmount

`number`

#### id

`string`

#### name

`string`

#### startAt

`Date`

#### updatedAt

`Date`

#### updaterId

`string`

### args

`unknown`

GraphQL arguments (unused)

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context containing authentication and database clients

## Returns

`Promise`\<`Date`\>

The timestamp when the fund campaign was last updated

## Throws

With code 'unauthenticated' if user is not logged in

## Throws

With code 'unauthorized_action' if user lacks required permissions

## Throws

With code 'unexpected' for database or other runtime errors
