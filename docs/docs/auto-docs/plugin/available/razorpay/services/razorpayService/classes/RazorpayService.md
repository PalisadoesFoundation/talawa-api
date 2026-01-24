[**talawa-api**](../../../../../../README.md)

***

# Class: RazorpayService

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:61

## Constructors

### Constructor

> **new RazorpayService**(`context`): `RazorpayService`

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:65

#### Parameters

##### context

[`GraphQLContext`](../../../../../../graphql/context/type-aliases/GraphQLContext.md)

#### Returns

`RazorpayService`

## Methods

### createOrder()

> **createOrder**(`orderData`): `Promise`\<`any`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:93

#### Parameters

##### orderData

[`RazorpayOrderData`](../interfaces/RazorpayOrderData.md)

#### Returns

`Promise`\<`any`\>

***

### createPayment()

> **createPayment**(`paymentData`): `Promise`\<`any`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:159

#### Parameters

##### paymentData

[`RazorpayPaymentData`](../interfaces/RazorpayPaymentData.md)

#### Returns

`Promise`\<`any`\>

***

### getPaymentDetails()

> **getPaymentDetails**(`paymentId`): `Promise`\<`any`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:349

#### Parameters

##### paymentId

`string`

#### Returns

`Promise`\<`any`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:69

#### Returns

`Promise`\<`void`\>

***

### processWebhook()

> **processWebhook**(`webhookData`): `Promise`\<`void`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:249

#### Parameters

##### webhookData

[`RazorpayWebhookData`](../interfaces/RazorpayWebhookData.md)

#### Returns

`Promise`\<`void`\>

***

### refundPayment()

> **refundPayment**(`paymentId`, `amount?`): `Promise`\<`any`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:364

#### Parameters

##### paymentId

`string`

##### amount?

`number`

#### Returns

`Promise`\<`any`\>

***

### testConnection()

> **testConnection**(): `Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:382

#### Returns

`Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

***

### verifyPayment()

> **verifyPayment**(`paymentId`, `orderId`, `signature`, `paymentData`): `Promise`\<`boolean`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:181

#### Parameters

##### paymentId

`string`

##### orderId

`string`

##### signature

`string`

##### paymentData

`string`

#### Returns

`Promise`\<`boolean`\>

***

### verifyWebhookSignature()

> **verifyWebhookSignature**(`webhookBody`, `signature`): `Promise`\<`boolean`\>

Defined in: src/plugin/available/razorpay/services/razorpayService.ts:215

#### Parameters

##### webhookBody

`string`

##### signature

`string`

#### Returns

`Promise`\<`boolean`\>
