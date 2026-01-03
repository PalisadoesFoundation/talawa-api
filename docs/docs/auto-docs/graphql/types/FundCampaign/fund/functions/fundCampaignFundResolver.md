[API Docs](/)

***

# Function: fundCampaignFundResolver()

> **fundCampaignFundResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `isArchived`: `boolean`; `isDefault`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/graphql/types/FundCampaign/fund.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/FundCampaign/fund.ts#L7)

## Parameters

### parent

#### amountRaised

`number`

#### createdAt

`Date`

#### creatorId

`string` \| `null`

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

`Date` \| `null`

#### updaterId

`string` \| `null`

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `createdAt`: `Date`; `creatorId`: `string` \| `null`; `id`: `string`; `isArchived`: `boolean`; `isDefault`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber`: `string` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>
