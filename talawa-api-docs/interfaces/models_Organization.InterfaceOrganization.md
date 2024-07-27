[talawa-api](../README.md) / [Exports](../modules.md) / [models/Organization](../modules/models_Organization.md) / InterfaceOrganization

# Interface: InterfaceOrganization

[models/Organization](../modules/models_Organization.md).InterfaceOrganization

This is an interface that represents a database(MongoDB) document for Organization.

## Table of contents

### Properties

- [\_id](models_Organization.InterfaceOrganization.md#_id)
- [address](models_Organization.InterfaceOrganization.md#address)
- [admins](models_Organization.InterfaceOrganization.md#admins)
- [apiUrl](models_Organization.InterfaceOrganization.md#apiurl)
- [blockedUsers](models_Organization.InterfaceOrganization.md#blockedusers)
- [createdAt](models_Organization.InterfaceOrganization.md#createdat)
- [creatorId](models_Organization.InterfaceOrganization.md#creatorid)
- [customFields](models_Organization.InterfaceOrganization.md#customfields)
- [description](models_Organization.InterfaceOrganization.md#description)
- [groupChats](models_Organization.InterfaceOrganization.md#groupchats)
- [image](models_Organization.InterfaceOrganization.md#image)
- [members](models_Organization.InterfaceOrganization.md#members)
- [membershipRequests](models_Organization.InterfaceOrganization.md#membershiprequests)
- [name](models_Organization.InterfaceOrganization.md#name)
- [pinnedPosts](models_Organization.InterfaceOrganization.md#pinnedposts)
- [posts](models_Organization.InterfaceOrganization.md#posts)
- [status](models_Organization.InterfaceOrganization.md#status)
- [updatedAt](models_Organization.InterfaceOrganization.md#updatedat)
- [userRegistrationRequired](models_Organization.InterfaceOrganization.md#userregistrationrequired)
- [visibleInSearch](models_Organization.InterfaceOrganization.md#visibleinsearch)

## Properties

### \_id

• **\_id**: `ObjectId`

#### Defined in

[src/models/Organization.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L12)

---

### address

• **address**: `Object`

#### Type declaration

| Name                | Type     |
| :------------------ | :------- |
| `city`              | `string` |
| `countryCode`       | `string` |
| `dependentLocality` | `string` |
| `line1`             | `string` |
| `line2`             | `string` |
| `postalCode`        | `string` |
| `sortingCode`       | `string` |
| `state`             | `string` |

#### Defined in

[src/models/Organization.ts:17](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L17)

---

### admins

• **admins**: `any`[]

#### Defined in

[src/models/Organization.ts:30](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L30)

---

### apiUrl

• **apiUrl**: `undefined` \| `string`

#### Defined in

[src/models/Organization.ts:13](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L13)

---

### blockedUsers

• **blockedUsers**: `any`[]

#### Defined in

[src/models/Organization.ts:35](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L35)

---

### createdAt

• **createdAt**: `Date`

#### Defined in

[src/models/Organization.ts:37](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L37)

---

### creatorId

• **creatorId**: `any`

#### Defined in

[src/models/Organization.ts:27](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L27)

---

### customFields

• **customFields**: `any`[]

#### Defined in

[src/models/Organization.ts:36](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L36)

---

### description

• **description**: `string`

#### Defined in

[src/models/Organization.ts:16](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L16)

---

### groupChats

• **groupChats**: `any`[]

#### Defined in

[src/models/Organization.ts:31](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L31)

---

### image

• **image**: `undefined` \| `string`

#### Defined in

[src/models/Organization.ts:14](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L14)

---

### members

• **members**: `any`[]

#### Defined in

[src/models/Organization.ts:29](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L29)

---

### membershipRequests

• **membershipRequests**: `any`[]

#### Defined in

[src/models/Organization.ts:34](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L34)

---

### name

• **name**: `string`

#### Defined in

[src/models/Organization.ts:15](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L15)

---

### pinnedPosts

• **pinnedPosts**: `any`[]

#### Defined in

[src/models/Organization.ts:33](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L33)

---

### posts

• **posts**: `any`[]

#### Defined in

[src/models/Organization.ts:32](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L32)

---

### status

• **status**: `string`

#### Defined in

[src/models/Organization.ts:28](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L28)

---

### updatedAt

• **updatedAt**: `Date`

#### Defined in

[src/models/Organization.ts:38](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L38)

---

### userRegistrationRequired

• **userRegistrationRequired**: `boolean`

#### Defined in

[src/models/Organization.ts:39](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L39)

---

### visibleInSearch

• **visibleInSearch**: `boolean`

#### Defined in

[src/models/Organization.ts:40](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/models/Organization.ts#L40)
