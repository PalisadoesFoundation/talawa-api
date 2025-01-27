[**talawa-api**](../../../../../README.md)

***

# Function: updatePost()

> **updatePost**(`req`, `res`): `Promise`\<`void`\>

Updates an existing post
async
function - updatePost

## Parameters

### req

[`InterfaceAuthenticatedRequest`](../../../../../middleware/isAuth/interfaces/InterfaceAuthenticatedRequest.md)

Express request object with authenticated user

### res

`Response`

Express response object

## Returns

`Promise`\<`void`\>

Promise<void> - Responds with updated post or error

Description
This controller handles post updates with the following features:
- Validates user permissions (creator, organization admin, or super admin)
- Supports file attachment updates with cleanup of old files
- Enforces business rules for pinned posts and titles
- Validates content length restrictions
- Maintains cache consistency

Request body expects:
```typescript
{
  title?: string;
  text?: string;
  pinned?: boolean;
}
```

Authorization Rules:
- Post creator can edit their own posts
- Organization admins can edit posts in their organizations
- Super admins can edit any post

## Throws

NotFoundError - When user or post is not found

## Throws

UnauthorizedError - When user lacks permissions to update the post

## Throws

InputValidationError - When title/text validation fails or pinned status requirements aren't met

## Defined in

[src/REST/controllers/mutation/updatePost.ts:73](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/REST/controllers/mutation/updatePost.ts#L73)
