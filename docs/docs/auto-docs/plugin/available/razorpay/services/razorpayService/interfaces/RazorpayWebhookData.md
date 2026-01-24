[**talawa-api**](../../../../../../README.md)

***

# Interface: RazorpayWebhookData

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:26

## Properties

### account\_id

> **account\_id**: `string`

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:28

***

### contains

> **contains**: `string`[]

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:30

***

### entity

> **entity**: `string`

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:27

***

### event

> **event**: `string`

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:29

***

### payload

> **payload**: `object`

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:31

#### payment

> **payment**: `object`

##### payment.entity

> **entity**: `object`

##### payment.entity.amount

> **amount**: `number`

##### payment.entity.amount\_refunded

> **amount\_refunded**: `number`

##### payment.entity.bank

> **bank**: `string` \| `null`

##### payment.entity.captured

> **captured**: `boolean`

##### payment.entity.card\_id

> **card\_id**: `string` \| `null`

##### payment.entity.contact

> **contact**: `string`

##### payment.entity.created\_at

> **created\_at**: `number`

##### payment.entity.currency

> **currency**: `string`

##### payment.entity.description

> **description**: `string`

##### payment.entity.email

> **email**: `string`

##### payment.entity.entity

> **entity**: `string`

##### payment.entity.error\_code

> **error\_code**: `string` \| `null`

##### payment.entity.error\_description

> **error\_description**: `string` \| `null`

##### payment.entity.fee

> **fee**: `number`

##### payment.entity.id

> **id**: `string`

##### payment.entity.method

> **method**: `string`

##### payment.entity.order\_id

> **order\_id**: `string`

##### payment.entity.refund\_status

> **refund\_status**: `string` \| `null`

##### payment.entity.status

> **status**: `string`

##### payment.entity.tax

> **tax**: `number`

##### payment.entity.vpa

> **vpa**: `string` \| `null`

##### payment.entity.wallet

> **wallet**: `string` \| `null`
