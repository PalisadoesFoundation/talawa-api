[talawa-api](../README.md) / [Exports](../modules.md) / [models/User](../modules/models_User.md) / InterfaceUserToReturn

# Interface: InterfaceUserToReturn

[models/User](../modules/models_User.md).InterfaceUserToReturn

This is an interface of the user that will be returned to the client side.
The differrence between this interface and the real User Interface is that it doesn't contains password field
Although this is a poor way, a better way will include implementing this Model with inclusion of password field and then using that model everywhere.

## Table of contents

### Properties

- [\_id](models_User.InterfaceUserToReturn.md#_id)
- [address](models_User.InterfaceUserToReturn.md#address)
- [adminApproved](models_User.InterfaceUserToReturn.md#adminapproved)
- [adminFor](models_User.InterfaceUserToReturn.md#adminfor)
- [appLanguageCode](models_User.InterfaceUserToReturn.md#applanguagecode)
- [birthDate](models_User.InterfaceUserToReturn.md#birthdate)
- [createdAt](models_User.InterfaceUserToReturn.md#createdat)
- [createdEvents](models_User.InterfaceUserToReturn.md#createdevents)
- [createdOrganizations](models_User.InterfaceUserToReturn.md#createdorganizations)
- [educationGrade](models_User.InterfaceUserToReturn.md#educationgrade)
- [email](models_User.InterfaceUserToReturn.md#email)
- [employmentStatus](models_User.InterfaceUserToReturn.md#employmentstatus)
- [eventAdmin](models_User.InterfaceUserToReturn.md#eventadmin)
- [firstName](models_User.InterfaceUserToReturn.md#firstname)
- [gender](models_User.InterfaceUserToReturn.md#gender)
- [image](models_User.InterfaceUserToReturn.md#image)
- [joinedOrganizations](models_User.InterfaceUserToReturn.md#joinedorganizations)
- [lastName](models_User.InterfaceUserToReturn.md#lastname)
- [maritalStatus](models_User.InterfaceUserToReturn.md#maritalstatus)
- [membershipRequests](models_User.InterfaceUserToReturn.md#membershiprequests)
- [organizationsBlockedBy](models_User.InterfaceUserToReturn.md#organizationsblockedby)
- [phone](models_User.InterfaceUserToReturn.md#phone)
- [pluginCreationAllowed](models_User.InterfaceUserToReturn.md#plugincreationallowed)
- [registeredEvents](models_User.InterfaceUserToReturn.md#registeredevents)
- [status](models_User.InterfaceUserToReturn.md#status)
- [token](models_User.InterfaceUserToReturn.md#token)
- [tokenVersion](models_User.InterfaceUserToReturn.md#tokenversion)
- [updatedAt](models_User.InterfaceUserToReturn.md#updatedat)
- [userType](models_User.InterfaceUserToReturn.md#usertype)

## Properties

### \_id

• **\_id**: `ObjectId`

#### Defined in

[src/models/User.ts:292](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L292)

___

### address

• **address**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `city` | `string` |
| `countryCode` | `string` |
| `dependentLocality` | `string` |
| `line1` | `string` |
| `line2` | `string` |
| `postalCode` | `string` |
| `sortingCode` | `string` |
| `state` | `string` |

#### Defined in

[src/models/User.ts:293](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L293)

___

### adminApproved

• **adminApproved**: `boolean`

#### Defined in

[src/models/User.ts:303](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L303)

___

### adminFor

• **adminFor**: `any`[]

#### Defined in

[src/models/User.ts:304](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L304)

___

### appLanguageCode

• **appLanguageCode**: `string`

#### Defined in

[src/models/User.ts:305](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L305)

___

### birthDate

• **birthDate**: `Date`

#### Defined in

[src/models/User.ts:306](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L306)

___

### createdAt

• **createdAt**: `Date`

#### Defined in

[src/models/User.ts:307](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L307)

___

### createdEvents

• **createdEvents**: `any`[]

#### Defined in

[src/models/User.ts:308](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L308)

___

### createdOrganizations

• **createdOrganizations**: `any`[]

#### Defined in

[src/models/User.ts:309](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L309)

___

### educationGrade

• **educationGrade**: `string`

#### Defined in

[src/models/User.ts:310](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L310)

___

### email

• **email**: `string`

#### Defined in

[src/models/User.ts:311](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L311)

___

### employmentStatus

• **employmentStatus**: `string`

#### Defined in

[src/models/User.ts:312](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L312)

___

### eventAdmin

• **eventAdmin**: `any`[]

#### Defined in

[src/models/User.ts:313](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L313)

___

### firstName

• **firstName**: `string`

#### Defined in

[src/models/User.ts:314](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L314)

___

### gender

• **gender**: `string`

#### Defined in

[src/models/User.ts:315](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L315)

___

### image

• **image**: `undefined` \| ``null`` \| `string`

#### Defined in

[src/models/User.ts:316](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L316)

___

### joinedOrganizations

• **joinedOrganizations**: `any`[]

#### Defined in

[src/models/User.ts:317](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L317)

___

### lastName

• **lastName**: `string`

#### Defined in

[src/models/User.ts:318](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L318)

___

### maritalStatus

• **maritalStatus**: `string`

#### Defined in

[src/models/User.ts:319](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L319)

___

### membershipRequests

• **membershipRequests**: `any`[]

#### Defined in

[src/models/User.ts:320](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L320)

___

### organizationsBlockedBy

• **organizationsBlockedBy**: `any`[]

#### Defined in

[src/models/User.ts:321](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L321)

___

### phone

• **phone**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `home` | `string` |
| `mobile` | `string` |
| `work` | `string` |

#### Defined in

[src/models/User.ts:322](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L322)

___

### pluginCreationAllowed

• **pluginCreationAllowed**: `boolean`

#### Defined in

[src/models/User.ts:327](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L327)

___

### registeredEvents

• **registeredEvents**: `any`[]

#### Defined in

[src/models/User.ts:328](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L328)

___

### status

• **status**: `string`

#### Defined in

[src/models/User.ts:329](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L329)

___

### token

• **token**: `undefined` \| `string`

#### Defined in

[src/models/User.ts:330](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L330)

___

### tokenVersion

• **tokenVersion**: `number`

#### Defined in

[src/models/User.ts:331](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L331)

___

### updatedAt

• **updatedAt**: `Date`

#### Defined in

[src/models/User.ts:332](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L332)

___

### userType

• **userType**: `string`

#### Defined in

[src/models/User.ts:333](https://github.com/PalisadoesFoundation/talawa-api/blob/fe9d65c/src/models/User.ts#L333)
