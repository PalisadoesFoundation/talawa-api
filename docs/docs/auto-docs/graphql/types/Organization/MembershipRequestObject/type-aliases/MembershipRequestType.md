[**talawa-api**](../../../../../README.md)

***

# Type Alias: MembershipRequestType

> **MembershipRequestType** = `object`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:6

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:20

Timestamp when the membership request was created

***

### membershipRequestId

> **membershipRequestId**: `string`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:8

Unique identifier for the membership request

***

### organizationId

> **organizationId**: `string`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:14

ID of the organization the user is requesting to join

***

### status

> **status**: *typeof* [`MembershipRequestStatusValues`](../../../../../drizzle/enums/membershipRequestStatus/variables/MembershipRequestStatusValues.md)\[`number`\]

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:17

Status of the membership request (e.g., pending, approved, rejected)

***

### userId

> **userId**: `string`

Defined in: src/graphql/types/Organization/MembershipRequestObject.ts:11

ID of the user who requested membership
