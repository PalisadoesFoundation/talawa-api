[talawa-api](../README.md) / [Exports](../modules.md) / constants

# Module: constants

## Table of contents

### Variables

- [ACCESS\_TOKEN\_SECRET](constants.md#access_token_secret)
- [ADMIN\_CANNOT\_CHANGE\_ITS\_ROLE](constants.md#admin_cannot_change_its_role)
- [ADMIN\_CHANGING\_ROLE\_OF\_CREATOR](constants.md#admin_changing_role_of_creator)
- [ADMIN\_REMOVING\_ADMIN](constants.md#admin_removing_admin)
- [ADMIN\_REMOVING\_CREATOR](constants.md#admin_removing_creator)
- [ADVERTISEMENT\_NOT\_FOUND\_ERROR](constants.md#advertisement_not_found_error)
- [BASE\_URL](constants.md#base_url)
- [CHAT\_NOT\_FOUND\_ERROR](constants.md#chat_not_found_error)
- [COMMENT\_NOT\_FOUND\_ERROR](constants.md#comment_not_found_error)
- [CUSTOM\_DATA\_NOT\_FOUND](constants.md#custom_data_not_found)
- [CUSTOM\_FIELD\_NAME\_MISSING](constants.md#custom_field_name_missing)
- [CUSTOM\_FIELD\_NOT\_FOUND](constants.md#custom_field_not_found)
- [CUSTOM\_FIELD\_TYPE\_MISSING](constants.md#custom_field_type_missing)
- [EMAIL\_ALREADY\_EXISTS\_ERROR](constants.md#email_already_exists_error)
- [ERROR\_IN\_SENDING\_MAIL](constants.md#error_in_sending_mail)
- [EVENT\_NOT\_FOUND\_ERROR](constants.md#event_not_found_error)
- [FEEDBACK\_ALREADY\_SUBMITTED](constants.md#feedback_already_submitted)
- [INCORRECT\_TAG\_INPUT](constants.md#incorrect_tag_input)
- [INTERNAL\_SERVER\_ERROR](constants.md#internal_server_error)
- [INVALID\_CREDENTIALS\_ERROR](constants.md#invalid_credentials_error)
- [INVALID\_FILE\_TYPE](constants.md#invalid_file_type)
- [INVALID\_OTP](constants.md#invalid_otp)
- [INVALID\_REFRESH\_TOKEN\_ERROR](constants.md#invalid_refresh_token_error)
- [INVALID\_ROLE\_TYPE](constants.md#invalid_role_type)
- [INVALID\_TAG\_INPUT](constants.md#invalid_tag_input)
- [IN\_PRODUCTION](constants.md#in_production)
- [LAST\_RESORT\_SUPERADMIN\_EMAIL](constants.md#last_resort_superadmin_email)
- [LENGTH\_VALIDATION\_ERROR](constants.md#length_validation_error)
- [MAIL\_PASSWORD](constants.md#mail_password)
- [MAIL\_USERNAME](constants.md#mail_username)
- [MAXIMUM\_FETCH\_LIMIT](constants.md#maximum_fetch_limit)
- [MEMBERSHIP\_REQUEST\_ALREADY\_EXISTS](constants.md#membership_request_already_exists)
- [MEMBERSHIP\_REQUEST\_NOT\_FOUND\_ERROR](constants.md#membership_request_not_found_error)
- [MEMBER\_NOT\_FOUND\_ERROR](constants.md#member_not_found_error)
- [MONGO\_DB\_URL](constants.md#mongo_db_url)
- [NO\_CHANGE\_IN\_TAG\_NAME](constants.md#no_change_in_tag_name)
- [ORGANIZATION\_IMAGE\_NOT\_FOUND\_ERROR](constants.md#organization_image_not_found_error)
- [ORGANIZATION\_MEMBER\_NOT\_FOUND\_ERROR](constants.md#organization_member_not_found_error)
- [ORGANIZATION\_NOT\_AUTHORIZED\_ERROR](constants.md#organization_not_authorized_error)
- [ORGANIZATION\_NOT\_FOUND\_ERROR](constants.md#organization_not_found_error)
- [POST\_NOT\_FOUND\_ERROR](constants.md#post_not_found_error)
- [RECAPTCHA\_SECRET\_KEY](constants.md#recaptcha_secret_key)
- [REDIS\_HOST](constants.md#redis_host)
- [REDIS\_PASSWORD](constants.md#redis_password)
- [REDIS\_PORT](constants.md#redis_port)
- [REFRESH\_TOKEN\_SECRET](constants.md#refresh_token_secret)
- [REGEX\_VALIDATION\_ERROR](constants.md#regex_validation_error)
- [REGISTRANT\_ALREADY\_EXIST\_ERROR](constants.md#registrant_already_exist_error)
- [SAME\_FILE\_ERROR](constants.md#same_file_error)
- [SAMPLE\_ORGANIZATION\_ALREADY\_EXISTS](constants.md#sample_organization_already_exists)
- [SMTP\_OPTIONS](constants.md#smtp_options)
- [STATUS\_ACTIVE](constants.md#status_active)
- [SUPERADMIN\_CANT\_CHANGE\_OWN\_ROLE](constants.md#superadmin_cant_change_own_role)
- [TAG\_ALREADY\_EXISTS](constants.md#tag_already_exists)
- [TAG\_NOT\_FOUND](constants.md#tag_not_found)
- [TRANSLATION\_ALREADY\_PRESENT\_ERROR](constants.md#translation_already_present_error)
- [UNAUTHENTICATED\_ERROR](constants.md#unauthenticated_error)
- [URL](constants.md#url)
- [USER\_ALREADY\_CHECKED\_IN](constants.md#user_already_checked_in)
- [USER\_ALREADY\_HAS\_TAG](constants.md#user_already_has_tag)
- [USER\_ALREADY\_MEMBER\_ERROR](constants.md#user_already_member_error)
- [USER\_ALREADY\_REGISTERED\_FOR\_EVENT](constants.md#user_already_registered_for_event)
- [USER\_ALREADY\_UNREGISTERED\_ERROR](constants.md#user_already_unregistered_error)
- [USER\_BLOCKING\_SELF](constants.md#user_blocking_self)
- [USER\_DOES\_NOT\_BELONG\_TO\_TAGS\_ORGANIZATION](constants.md#user_does_not_belong_to_tags_organization)
- [USER\_DOES\_NOT\_HAVE\_THE\_TAG](constants.md#user_does_not_have_the_tag)
- [USER\_NOT\_AUTHORIZED\_ADMIN](constants.md#user_not_authorized_admin)
- [USER\_NOT\_AUTHORIZED\_ERROR](constants.md#user_not_authorized_error)
- [USER\_NOT\_AUTHORIZED\_SUPERADMIN](constants.md#user_not_authorized_superadmin)
- [USER\_NOT\_AUTHORIZED\_TO\_CREATE\_TAG](constants.md#user_not_authorized_to_create_tag)
- [USER\_NOT\_AUTHORIZED\_TO\_PIN](constants.md#user_not_authorized_to_pin)
- [USER\_NOT\_CHECKED\_IN](constants.md#user_not_checked_in)
- [USER\_NOT\_FOUND\_ERROR](constants.md#user_not_found_error)
- [USER\_NOT\_MEMBER\_FOR\_ORGANIZATION](constants.md#user_not_member_for_organization)
- [USER\_NOT\_ORGANIZATION\_ADMIN](constants.md#user_not_organization_admin)
- [USER\_NOT\_REGISTERED\_FOR\_EVENT](constants.md#user_not_registered_for_event)
- [USER\_PROFILE\_IMAGE\_NOT\_FOUND\_ERROR](constants.md#user_profile_image_not_found_error)
- [USER\_REMOVING\_SELF](constants.md#user_removing_self)
- [USER\_TO\_BE\_REMOVED\_NOT\_FOUND\_ERROR](constants.md#user_to_be_removed_not_found_error)
- [VOLUNTEER\_NOT\_FOUND\_ERROR](constants.md#volunteer_not_found_error)
- [VOLUNTEER\_NOT\_MEMBER\_ERROR](constants.md#volunteer_not_member_error)
- [iv](constants.md#iv)
- [key](constants.md#key)

## Variables

### ACCESS\_TOKEN\_SECRET

• `Const` **ACCESS\_TOKEN\_SECRET**: `undefined` \| `string` = `ENV.ACCESS_TOKEN_SECRET`

#### Defined in

[src/constants.ts:419](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L419)

___

### ADMIN\_CANNOT\_CHANGE\_ITS\_ROLE

• `Const` **ADMIN\_CANNOT\_CHANGE\_ITS\_ROLE**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:202](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L202)

___

### ADMIN\_CHANGING\_ROLE\_OF\_CREATOR

• `Const` **ADMIN\_CHANGING\_ROLE\_OF\_CREATOR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:195](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L195)

___

### ADMIN\_REMOVING\_ADMIN

• `Const` **ADMIN\_REMOVING\_ADMIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:183](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L183)

___

### ADMIN\_REMOVING\_CREATOR

• `Const` **ADMIN\_REMOVING\_CREATOR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:189](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L189)

___

### ADVERTISEMENT\_NOT\_FOUND\_ERROR

• `Const` **ADVERTISEMENT\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:276](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L276)

___

### BASE\_URL

• `Const` **BASE\_URL**: `string`

#### Defined in

[src/constants.ts:417](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L417)

___

### CHAT\_NOT\_FOUND\_ERROR

• `Const` **CHAT\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:10](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L10)

___

### COMMENT\_NOT\_FOUND\_ERROR

• `Const` **COMMENT\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:16](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L16)

___

### CUSTOM\_DATA\_NOT\_FOUND

• `Const` **CUSTOM\_DATA\_NOT\_FOUND**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:391](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L391)

___

### CUSTOM\_FIELD\_NAME\_MISSING

• `Const` **CUSTOM\_FIELD\_NAME\_MISSING**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:403](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L403)

___

### CUSTOM\_FIELD\_NOT\_FOUND

• `Const` **CUSTOM\_FIELD\_NOT\_FOUND**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:397](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L397)

___

### CUSTOM\_FIELD\_TYPE\_MISSING

• `Const` **CUSTOM\_FIELD\_TYPE\_MISSING**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:409](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L409)

___

### EMAIL\_ALREADY\_EXISTS\_ERROR

• `Const` **EMAIL\_ALREADY\_EXISTS\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:357](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L357)

___

### ERROR\_IN\_SENDING\_MAIL

• `Const` **ERROR\_IN\_SENDING\_MAIL**: ``"Error in sending mail"``

#### Defined in

[src/constants.ts:22](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L22)

___

### EVENT\_NOT\_FOUND\_ERROR

• `Const` **EVENT\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:23](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L23)

___

### FEEDBACK\_ALREADY\_SUBMITTED

• `Const` **FEEDBACK\_ALREADY\_SUBMITTED**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:30](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L30)

___

### INCORRECT\_TAG\_INPUT

• `Const` **INCORRECT\_TAG\_INPUT**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:235](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L235)

___

### INTERNAL\_SERVER\_ERROR

• `Const` **INTERNAL\_SERVER\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:110](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L110)

___

### INVALID\_CREDENTIALS\_ERROR

• `Const` **INVALID\_CREDENTIALS\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:337](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L337)

___

### INVALID\_FILE\_TYPE

• `Const` **INVALID\_FILE\_TYPE**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:91](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L91)

___

### INVALID\_OTP

• `Const` **INVALID\_OTP**: ``"Invalid OTP"``

#### Defined in

[src/constants.ts:36](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L36)

___

### INVALID\_REFRESH\_TOKEN\_ERROR

• `Const` **INVALID\_REFRESH\_TOKEN\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:343](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L343)

___

### INVALID\_ROLE\_TYPE

• `Const` **INVALID\_ROLE\_TYPE**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:97](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L97)

___

### INVALID\_TAG\_INPUT

• `Const` **INVALID\_TAG\_INPUT**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:228](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L228)

___

### IN\_PRODUCTION

• `Const` **IN\_PRODUCTION**: `boolean`

#### Defined in

[src/constants.ts:38](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L38)

___

### LAST\_RESORT\_SUPERADMIN\_EMAIL

• `Const` **LAST\_RESORT\_SUPERADMIN\_EMAIL**: `undefined` \| `string` = `process.env.LAST_RESORT_SUPERADMIN_EMAIL`

#### Defined in

[src/constants.ts:431](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L431)

___

### LENGTH\_VALIDATION\_ERROR

• `Const` **LENGTH\_VALIDATION\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:122](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L122)

___

### MAIL\_PASSWORD

• `Const` **MAIL\_PASSWORD**: `undefined` \| `string` = `ENV.MAIL_PASSWORD`

#### Defined in

[src/constants.ts:429](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L429)

___

### MAIL\_USERNAME

• `Const` **MAIL\_USERNAME**: `undefined` \| `string` = `ENV.MAIL_USERNAME`

#### Defined in

[src/constants.ts:427](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L427)

___

### MAXIMUM\_FETCH\_LIMIT

• `Const` **MAXIMUM\_FETCH\_LIMIT**: ``100``

#### Defined in

[src/constants.ts:415](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L415)

___

### MEMBERSHIP\_REQUEST\_ALREADY\_EXISTS

• `Const` **MEMBERSHIP\_REQUEST\_ALREADY\_EXISTS**: ``"Membership Request already exists"``

#### Defined in

[src/constants.ts:51](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L51)

___

### MEMBERSHIP\_REQUEST\_NOT\_FOUND\_ERROR

• `Const` **MEMBERSHIP\_REQUEST\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:45](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L45)

___

### MEMBER\_NOT\_FOUND\_ERROR

• `Const` **MEMBER\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:39](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L39)

___

### MONGO\_DB\_URL

• `Const` **MONGO\_DB\_URL**: `undefined` \| `string` = `ENV.MONGO_DB_URL`

#### Defined in

[src/constants.ts:423](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L423)

___

### NO\_CHANGE\_IN\_TAG\_NAME

• `Const` **NO\_CHANGE\_IN\_TAG\_NAME**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:241](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L241)

___

### ORGANIZATION\_IMAGE\_NOT\_FOUND\_ERROR

• `Const` **ORGANIZATION\_IMAGE\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:72](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L72)

___

### ORGANIZATION\_MEMBER\_NOT\_FOUND\_ERROR

• `Const` **ORGANIZATION\_MEMBER\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:54](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L54)

___

### ORGANIZATION\_NOT\_AUTHORIZED\_ERROR

• `Const` **ORGANIZATION\_NOT\_AUTHORIZED\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:60](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L60)

___

### ORGANIZATION\_NOT\_FOUND\_ERROR

• `Const` **ORGANIZATION\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:66](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L66)

___

### POST\_NOT\_FOUND\_ERROR

• `Const` **POST\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:78](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L78)

___

### RECAPTCHA\_SECRET\_KEY

• `Const` **RECAPTCHA\_SECRET\_KEY**: `undefined` \| `string` = `ENV.RECAPTCHA_SECRET_KEY`

#### Defined in

[src/constants.ts:425](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L425)

___

### REDIS\_HOST

• `Const` **REDIS\_HOST**: `string`

#### Defined in

[src/constants.ts:443](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L443)

___

### REDIS\_PASSWORD

• `Const` **REDIS\_PASSWORD**: `undefined` \| `string` = `process.env.REDIS_PASSWORD`

#### Defined in

[src/constants.ts:445](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L445)

___

### REDIS\_PORT

• `Const` **REDIS\_PORT**: `number`

#### Defined in

[src/constants.ts:444](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L444)

___

### REFRESH\_TOKEN\_SECRET

• `Const` **REFRESH\_TOKEN\_SECRET**: `undefined` \| `string` = `ENV.REFRESH_TOKEN_SECRET`

#### Defined in

[src/constants.ts:421](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L421)

___

### REGEX\_VALIDATION\_ERROR

• `Const` **REGEX\_VALIDATION\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:128](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L128)

___

### REGISTRANT\_ALREADY\_EXIST\_ERROR

• `Const` **REGISTRANT\_ALREADY\_EXIST\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:84](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L84)

___

### SAME\_FILE\_ERROR

• `Const` **SAME\_FILE\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:104](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L104)

___

### SAMPLE\_ORGANIZATION\_ALREADY\_EXISTS

• `Const` **SAMPLE\_ORGANIZATION\_ALREADY\_EXISTS**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:384](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L384)

___

### SMTP\_OPTIONS

• `Const` **SMTP\_OPTIONS**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `IS_SMTP` | `undefined` \| `string` |
| `SMTP_HOST` | `undefined` \| `string` |
| `SMTP_PASSWORD` | `undefined` \| `string` |
| `SMTP_PORT` | `undefined` \| `string` |
| `SMTP_SSL_TLS` | `undefined` \| `string` |
| `SMTP_USERNAME` | `undefined` \| `string` |

#### Defined in

[src/constants.ts:434](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L434)

___

### STATUS\_ACTIVE

• `Const` **STATUS\_ACTIVE**: ``"ACTIVE"``

#### Defined in

[src/constants.ts:282](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L282)

___

### SUPERADMIN\_CANT\_CHANGE\_OWN\_ROLE

• `Const` **SUPERADMIN\_CANT\_CHANGE\_OWN\_ROLE**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:325](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L325)

___

### TAG\_ALREADY\_EXISTS

• `Const` **TAG\_ALREADY\_EXISTS**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:248](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L248)

___

### TAG\_NOT\_FOUND

• `Const` **TAG\_NOT\_FOUND**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:215](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L215)

___

### TRANSLATION\_ALREADY\_PRESENT\_ERROR

• `Const` **TRANSLATION\_ALREADY\_PRESENT\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:331](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L331)

___

### UNAUTHENTICATED\_ERROR

• `Const` **UNAUTHENTICATED\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:116](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L116)

___

### URL

• `Const` **URL**: ``"http://localhost:4000/graphql"`` \| ``"http://calico.palisadoes.org/talawa/graphql"``

#### Defined in

[src/constants.ts:284](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L284)

___

### USER\_ALREADY\_CHECKED\_IN

• `Const` **USER\_ALREADY\_CHECKED\_IN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:378](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L378)

___

### USER\_ALREADY\_HAS\_TAG

• `Const` **USER\_ALREADY\_HAS\_TAG**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:262](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L262)

___

### USER\_ALREADY\_MEMBER\_ERROR

• `Const` **USER\_ALREADY\_MEMBER\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:289](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L289)

___

### USER\_ALREADY\_REGISTERED\_FOR\_EVENT

• `Const` **USER\_ALREADY\_REGISTERED\_FOR\_EVENT**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:146](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L146)

___

### USER\_ALREADY\_UNREGISTERED\_ERROR

• `Const` **USER\_ALREADY\_UNREGISTERED\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:295](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L295)

___

### USER\_BLOCKING\_SELF

• `Const` **USER\_BLOCKING\_SELF**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:170](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L170)

___

### USER\_DOES\_NOT\_BELONG\_TO\_TAGS\_ORGANIZATION

• `Const` **USER\_DOES\_NOT\_BELONG\_TO\_TAGS\_ORGANIZATION**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:221](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L221)

___

### USER\_DOES\_NOT\_HAVE\_THE\_TAG

• `Const` **USER\_DOES\_NOT\_HAVE\_THE\_TAG**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:269](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L269)

___

### USER\_NOT\_AUTHORIZED\_ADMIN

• `Const` **USER\_NOT\_AUTHORIZED\_ADMIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:140](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L140)

___

### USER\_NOT\_AUTHORIZED\_ERROR

• `Const` **USER\_NOT\_AUTHORIZED\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:301](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L301)

___

### USER\_NOT\_AUTHORIZED\_SUPERADMIN

• `Const` **USER\_NOT\_AUTHORIZED\_SUPERADMIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:134](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L134)

___

### USER\_NOT\_AUTHORIZED\_TO\_CREATE\_TAG

• `Const` **USER\_NOT\_AUTHORIZED\_TO\_CREATE\_TAG**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:255](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L255)

___

### USER\_NOT\_AUTHORIZED\_TO\_PIN

• `Const` **USER\_NOT\_AUTHORIZED\_TO\_PIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:208](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L208)

___

### USER\_NOT\_CHECKED\_IN

• `Const` **USER\_NOT\_CHECKED\_IN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:158](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L158)

___

### USER\_NOT\_FOUND\_ERROR

• `Const` **USER\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:307](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L307)

___

### USER\_NOT\_MEMBER\_FOR\_ORGANIZATION

• `Const` **USER\_NOT\_MEMBER\_FOR\_ORGANIZATION**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:313](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L313)

___

### USER\_NOT\_ORGANIZATION\_ADMIN

• `Const` **USER\_NOT\_ORGANIZATION\_ADMIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:164](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L164)

___

### USER\_NOT\_REGISTERED\_FOR\_EVENT

• `Const` **USER\_NOT\_REGISTERED\_FOR\_EVENT**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:152](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L152)

___

### USER\_PROFILE\_IMAGE\_NOT\_FOUND\_ERROR

• `Const` **USER\_PROFILE\_IMAGE\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:350](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L350)

___

### USER\_REMOVING\_SELF

• `Const` **USER\_REMOVING\_SELF**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:176](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L176)

___

### USER\_TO\_BE\_REMOVED\_NOT\_FOUND\_ERROR

• `Const` **USER\_TO\_BE\_REMOVED\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:319](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L319)

___

### VOLUNTEER\_NOT\_FOUND\_ERROR

• `Const` **VOLUNTEER\_NOT\_FOUND\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:364](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L364)

___

### VOLUNTEER\_NOT\_MEMBER\_ERROR

• `Const` **VOLUNTEER\_NOT\_MEMBER\_ERROR**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `CODE` | `string` |
| `DESC` | `string` |
| `MESSAGE` | `string` |
| `PARAM` | `string` |

#### Defined in

[src/constants.ts:371](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L371)

___

### iv

• `Const` **iv**: `string`

#### Defined in

[src/constants.ts:448](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L448)

___

### key

• `Const` **key**: `string`

#### Defined in

[src/constants.ts:447](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/constants.ts#L447)
