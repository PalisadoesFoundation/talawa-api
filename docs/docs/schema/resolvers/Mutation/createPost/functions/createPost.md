[**talawa-api**](../../../../README.md)

***

# Function: createPost()

> **createPost**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

Creates a new post and associates it with an organization.

This function performs the following actions:
1. Verifies the existence of the current user and retrieves their details and application profile.
2. Checks if the specified organization exists and retrieves its details.
3. Validates that the user is a member of the organization or is a super admin.
4. Handles file uploads for images and videos, if provided.
5. Validates the post title and ensures it meets the criteria for pinning.
6. Checks user permissions to pin the post if required.
7. Creates the post and updates the organization with the pinned post if applicable.
8. Caches the newly created post and organization.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreatePostArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreatePostArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.organizationId`: The ID of the organization where the post will be created.
  - `data.title`: The title of the post (optional but required if the post is pinned).
  - `data.text`: The text content of the post.
  - `data.pinned`: A boolean indicating whether the post should be pinned.
  - `file`: An optional base64-encoded image or video file.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user creating the post.
  - `apiRootUrl`: The root URL of the API for constructing file URLs.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfacePost`](../../../../models/Post/interfaces/InterfacePost.md)\>\>

The created post object, including URLs for uploaded image and video files if provided.

## See

 - User - The User model used to interact with user data in the database.
 - AppUserProfile - The AppUserProfile model used to interact with user profile data in the database.
 - Organization - The Organization model used to interact with organization data in the database.
 - Post - The Post model used to interact with post data in the database.
 - uploadEncodedImage - A utility function for uploading encoded image files.
 - uploadEncodedVideo - A utility function for uploading encoded video files.

## Defined in

[src/resolvers/Mutation/createPost.ts:64](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createPost.ts#L64)
