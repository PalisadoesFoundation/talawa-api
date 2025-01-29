[**talawa-api**](../../../../../README.md)

***

# Function: createPost()

> **createPost**(`req`, `res`): `Promise`\<`void`\>

Creates a new post within an organization
async
function - createPost

## Parameters

### req

[`InterfaceAuthenticatedRequest`](../../../../../middleware/isAuth/interfaces/InterfaceAuthenticatedRequest.md)

Express request object with authenticated user

### res

`Response`

Express response object

## Returns

`Promise`\<`void`\>

Promise<void> - Responds with created post or error

Description
This controller handles post creation with the following features:
- Validates user membership in the organization
- Supports file attachments
- Handles post pinning with proper authorization
- Validates title and text length
- Caches created posts and updated organizations

Request body expects:
```typescript
{
  organizationId: string;
  title?: string;
  text: string;
  pinned?: boolean;
}
```

## Throws

NotFoundError - When user or organization is not found

## Throws

UnauthorizedError - When user is not authorized or lacks permissions

## Throws

InputValidationError - When title or text validation fails

## Defined in

[src/REST/controllers/mutation/createPost.ts:71](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/REST/controllers/mutation/createPost.ts#L71)
