[**talawa-api**](../../../../README.md)

***

# Variable: mutationCreateUserInputSchema

> `const` **mutationCreateUserInputSchema**: `ZodObject`\<\{ `addressLine1`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `addressLine2`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodCustom`\<`Promise`\<`FileUpload`\>, `Promise`\<`FileUpload`\>\>\>\>; `birthDate`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `city`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `educationGrade`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `emailAddress`: `ZodString`; `employmentStatus`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `failedLoginAttempts`: `ZodOptional`\<`ZodInt`\>; `homePhoneNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isEmailAddressVerified`: `ZodBoolean`; `lastFailedLoginAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `lockedUntil`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `maritalStatus`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `mobilePhoneNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `natalSex`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `naturalLanguageCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `password`: `ZodString`; `postalCode`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `role`: `ZodString`; `state`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `workPhoneNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, \{ \}\>

Defined in: [src/graphql/inputs/MutationCreateUserInput.ts:13](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/inputs/MutationCreateUserInput.ts#L13)
