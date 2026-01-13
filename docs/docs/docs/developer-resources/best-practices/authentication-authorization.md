---
id: authentication-authorization-guide
title: Authentication and Authorization Guide
slug: /developer-resources/authentication-authorization-guide
sidebar_position: 85
---

This document outlines the authentication and authorization architecture and best practices in the Talawa API codebase.

## Introduction

Authentication and authorization are critical security components that control who can access the API and what actions they can perform. This guide explains how Talawa API implements these security mechanisms using JWT tokens, role-based access control, and GraphQL context.

## Core Concepts

### Authentication vs Authorization

**Authentication** answers: "Who are you?"
- Verifies the identity of a user
- Implemented using JWT (JSON Web Tokens)
- Handles login, token generation, and token validation

**Authorization** answers: "What can you do?"
- Determines what an authenticated user is allowed to do
- Implemented using role-based access control (RBAC)
- Checks permissions before allowing operations

## Authentication Architecture

### JWT Token System

Talawa API uses a dual-token system for authentication:

1. **Access Token**: Short-lived JWT token for API requests
2. **Refresh Token**: Long-lived token for obtaining new access tokens

#### Token Structure

```typescript
interface JWTPayload {
  userId: string;
  tokenVersion: number;
  iat: number;  // Issued at
  exp: number;  // Expiration time
}
```

#### Token Generation

```typescript
import jwt from 'jsonwebtoken';

// Generate access token (expires in 15 minutes)
const accessToken = jwt.sign(
  { userId: user._id, tokenVersion: user.tokenVersion },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '15m' }
);

// Generate refresh token (expires in 7 days)
const refreshToken = jwt.sign(
  { userId: user._id, tokenVersion: user.tokenVersion },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);
```

#### Token Verification

All protected GraphQL operations verify the access token:

```typescript
import { verify } from 'jsonwebtoken';

// In context creation
const token = request.headers.authorization?.replace('Bearer ', '');

if (token) {
  try {
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET);
    context.userId = payload.userId;
  } catch (error) {
    // Token invalid or expired
    context.userId = null;
  }
}
```

### Token Versioning

Token versioning allows immediate invalidation of all user tokens:

```typescript
// When user changes password or requests logout from all devices
await drizzleClient
  .update(usersTable)
  .set({ 
    tokenVersion: sql`${usersTable.tokenVersion} + 1`,
    updatedAt: new Date()
  })
  .where(eq(usersTable.id, userId));

// All existing tokens become invalid immediately
```

### Authentication Flow

```
1. User Login
   └─> Client sends credentials (email + password)
   └─> Server verifies credentials
   └─> Server generates access + refresh tokens
   └─> Server returns tokens + user data

2. Authenticated Request
   └─> Client includes access token in Authorization header
   └─> Server verifies token in context creation
   └─> Server attaches userId to context
   └─> Resolver has access to authenticated user

3. Token Refresh
   └─> Access token expires
   └─> Client sends refresh token
   └─> Server verifies refresh token
   └─> Server generates new access token
   └─> Client continues with new token
```

## Authorization Architecture

### Role-Based Access Control (RBAC)

Talawa implements a hierarchical role system:

```
SUPERADMIN (Global)
    |
    └─> ADMIN (Organization-level)
            |
            ├─> USER (Organization member)
            └─> BLOCKED (Restricted user)
```

### Role Definitions

```typescript
// User roles within an organization
enum UserRole {
  SUPERADMIN = 'SUPERADMIN',  // Platform-wide administrator
  ADMIN = 'ADMIN',            // Organization administrator
  USER = 'USER',              // Regular organization member
  BLOCKED = 'BLOCKED'         // Blocked from organization
}
```

### Authorization Utilities

#### Checking User Authentication

```typescript
import { assertUserAuthenticated } from '~/src/utilities/authorization';

// In resolver
export const myMutation = async (parent, args, context) => {
  // Throws error if user is not authenticated
  const currentUser = assertUserAuthenticated(context);
  
  // Continue with authenticated user
};
```

#### Checking Organization Admin

```typescript
import { assertOrganizationAdmin } from '~/src/utilities/authorization';

// In resolver
export const updateOrganization = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  // Throws error if user is not an admin of the organization
  await assertOrganizationAdmin(
    currentUser,
    args.organizationId,
    context.drizzleClient
  );
  
  // User is verified as organization admin
};
```

#### Checking Superadmin

```typescript
import { assertSuperAdmin } from '~/src/utilities/authorization';

// In resolver
export const deletePlatformUser = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  // Throws error if user is not a superadmin
  assertSuperAdmin(currentUser);
  
  // User is verified as superadmin
};
```

## Best Practices

### 1. Always Verify Authentication First

```typescript
// GOOD
export const createEvent = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  // Now we know user is authenticated
  const event = await createEventLogic(currentUser, args);
  return event;
};

// BAD - No authentication check
export const createEvent = async (parent, args, context) => {
  // Anyone can create events!
  const event = await createEventLogic(context.userId, args);
  return event;
};
```

### 2. Check Authorization Before Data Access

```typescript
// GOOD
export const viewPrivateData = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  // Check if user can view this data
  const resource = await getResource(args.id);
  if (resource.ownerId !== currentUser._id) {
    throw new Error('Unauthorized');
  }
  
  return resource;
};

// BAD - Returns data before checking ownership
export const viewPrivateData = async (parent, args, context) => {
  return await getResource(args.id);
};
```

### 3. Use Field-Level Authorization for Sensitive Data

```typescript
// In GraphQL resolvers
const User = {
  email: (parent, args, context) => {
    const currentUser = assertUserAuthenticated(context);
    
    // Only show email to the user themselves or admins
    if (parent._id !== currentUser._id && !currentUser.isSuperAdmin) {
      return '********'; // Masked email
    }
    
    return parent.email;
  },
  
  phoneNumber: (parent, args, context) => {
    // Similar authorization for phone numbers
    const currentUser = assertUserAuthenticated(context);
    
    if (parent._id !== currentUser._id) {
      return null; // Hide phone number
    }
    
    return parent.phoneNumber;
  }
};
```

### 4. Validate Token on Every Request

```typescript
// In context creation (src/routes/graphql.ts)
export const createContext = async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  let userId = null;
  
  if (token) {
    try {
      const payload = verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      // Verify token version matches database
      const user = await getUserById(payload.userId);
      if (user && user.tokenVersion === payload.tokenVersion) {
        userId = user._id;
      }
    } catch (error) {
      // Invalid token - userId remains null
      logger.warn('Invalid token provided');
    }
  }
  
  return {
    userId,
    drizzleClient,
    // ... other context properties
  };
};
```

### 5. Handle Authorization Errors Properly

```typescript
// Use descriptive error messages
if (!isAuthorized) {
  throw new Error('You do not have permission to perform this action');
}

// Or use custom error types
class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

throw new UnauthorizedError('Admin privileges required');
```

### 6. Secure Token Storage

**Client-side recommendations:**

- Store access tokens in memory (React state/Redux)
- Store refresh tokens in httpOnly cookies (not accessible via JavaScript)
- Never store tokens in localStorage (vulnerable to XSS attacks)

**Server-side:**

```typescript
// Set httpOnly cookie for refresh token
reply.setCookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### 7. Rate Limit Authentication Attempts

```typescript
// Prevent brute force attacks
import rateLimit from '@fastify/rate-limit';

fastify.register(rateLimit, {
  max: 5, // Maximum 5 requests
  timeWindow: '15 minutes',
  errorResponseBuilder: (request, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Try again later.',
  }),
  routes: ['/graphql'] // Apply to specific routes
});
```

### 8. Implement Password Security

```typescript
import bcrypt from 'bcryptjs';

// Hash passwords before storing
const hashedPassword = await bcrypt.hash(password, 12);

// Verify passwords during login
const isValid = await bcrypt.compare(providedPassword, storedHash);

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function validatePassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_REGEX.test(password)
  );
}
```

### 9. Audit Sensitive Operations

```typescript
// Log important security events
export const deleteUser = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  assertSuperAdmin(currentUser);
  
  // Log the action
  logger.info({
    action: 'USER_DELETED',
    performedBy: currentUser._id,
    targetUser: args.userId,
    timestamp: new Date(),
  });
  
  await deleteUserFromDatabase(args.userId);
};
```

### 10. Use Middleware for Common Checks

```typescript
// Create reusable middleware
const requireAuth = (resolver) => {
  return (parent, args, context, info) => {
    assertUserAuthenticated(context);
    return resolver(parent, args, context, info);
  };
};

const requireAdmin = (resolver) => {
  return async (parent, args, context, info) => {
    const currentUser = assertUserAuthenticated(context);
    await assertOrganizationAdmin(
      currentUser,
      args.organizationId,
      context.drizzleClient
    );
    return resolver(parent, args, context, info);
  };
};

// Use in resolvers
export const Mutation = {
  createEvent: requireAuth(createEventResolver),
  updateOrganization: requireAdmin(updateOrganizationResolver),
};
```

## Common Authorization Patterns

### Pattern 1: Resource Ownership Check

```typescript
// Check if user owns the resource
export const deletePost = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  const post = await context.drizzleClient.query.postsTable.findFirst({
    where: eq(postsTable.id, args.postId)
  });
  
  if (!post) {
    throw new Error('Post not found');
  }
  
  if (post.creatorId !== currentUser._id) {
    throw new Error('You can only delete your own posts');
  }
  
  await context.drizzleClient
    .delete(postsTable)
    .where(eq(postsTable.id, args.postId));
    
  return { success: true };
};
```

### Pattern 2: Organization Membership Check

```typescript
// Check if user is member of organization
export const viewOrganizationData = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  const membership = await context.drizzleClient.query.organizationMemberships.findFirst({
    where: and(
      eq(organizationMemberships.userId, currentUser._id),
      eq(organizationMemberships.organizationId, args.organizationId),
      ne(organizationMemberships.role, 'BLOCKED')
    )
  });
  
  if (!membership) {
    throw new Error('You are not a member of this organization');
  }
  
  // Proceed with operation
};
```

### Pattern 3: Hierarchical Permission Check

```typescript
// Superadmins can do anything, admins can manage their org, users can manage their own data
export const updateUserProfile = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  
  // Superadmin can update anyone
  if (currentUser.isSuperAdmin) {
    return updateUser(args.userId, args.updates);
  }
  
  // Org admin can update members of their org
  const isOrgAdmin = await checkOrgAdmin(
    currentUser._id,
    args.targetUserId
  );
  
  if (isOrgAdmin) {
    return updateUser(args.userId, args.updates);
  }
  
  // Users can only update themselves
  if (currentUser._id !== args.userId) {
    throw new Error('Insufficient permissions');
  }
  
  return updateUser(args.userId, args.updates);
};
```

## Security Checklist

When implementing new features, ensure:

- [ ] All mutations require authentication
- [ ] Queries for user-specific data verify authentication
- [ ] Organization operations check org membership/admin status
- [ ] Sensitive fields have field-level authorization
- [ ] Tokens are validated on every request
- [ ] Token versions are checked against database
- [ ] Passwords are hashed using bcrypt (min 12 rounds)
- [ ] Rate limiting is applied to authentication endpoints
- [ ] Security events are logged for audit trail
- [ ] Error messages don't leak sensitive information
- [ ] Authorization checks happen before database queries
- [ ] Refresh tokens are stored in httpOnly cookies

## Testing Authorization

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('updateOrganization', () => {
  it('should throw error if user is not authenticated', async () => {
    const context = { userId: null };
    
    await expect(
      updateOrganization(null, { id: '123' }, context)
    ).rejects.toThrow('User not authenticated');
  });
  
  it('should throw error if user is not org admin', async () => {
    const context = { 
      userId: 'user123',
      drizzleClient: mockDb 
    };
    
    await expect(
      updateOrganization(null, { id: 'org123' }, context)
    ).rejects.toThrow('Admin privileges required');
  });
  
  it('should allow org admin to update organization', async () => {
    const context = {
      userId: 'admin123',
      drizzleClient: mockDb
    };
    
    const result = await updateOrganization(
      null,
      { id: 'org123', name: 'New Name' },
      context
    );
    
    expect(result.name).toBe('New Name');
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should login and use access token for authenticated request', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(email: "test@example.com", password: "password123") {
              accessToken
              user { _id }
            }
          }
        `
      });
    
    const { accessToken } = loginResponse.body.data.login;
    
    // 2. Use token for authenticated request
    const profileResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          query {
            me { email }
          }
        `
      });
    
    expect(profileResponse.body.data.me.email).toBe('test@example.com');
  });
});
```

## Environment Variables

Required authentication-related environment variables:

```bash
# JWT Secrets (use long, random strings in production)
ACCESS_TOKEN_SECRET=your-access-token-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars

# Token Expiration
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Password Requirements
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_SPECIAL_CHAR=true
PASSWORD_REQUIRE_NUMBER=true
```

## Common Pitfalls

### 1. Not Checking Authentication

```typescript
// WRONG - Anyone can create an organization
export const createOrganization = async (parent, args, context) => {
  return await createOrg(args);
};

// RIGHT - Only authenticated users can create
export const createOrganization = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  return await createOrg(currentUser, args);
};
```

### 2. Trusting Client-Provided User IDs

```typescript
// WRONG - Client can pass any userId
export const updateProfile = async (parent, args, context) => {
  return await updateUser(args.userId, args.updates);
};

// RIGHT - Use authenticated user's ID from context
export const updateProfile = async (parent, args, context) => {
  const currentUser = assertUserAuthenticated(context);
  return await updateUser(currentUser._id, args.updates);
};
```

### 3. Forgetting to Check Token Version

```typescript
// WRONG - Doesn't check if token was revoked
const payload = verify(token, SECRET);
context.userId = payload.userId;

// RIGHT - Verify token version matches database
const payload = verify(token, SECRET);
const user = await getUserById(payload.userId);
if (user.tokenVersion === payload.tokenVersion) {
  context.userId = user._id;
}
```

### 4. Exposing Sensitive Data in Errors

```typescript
// WRONG - Reveals user existence
if (!user) {
  throw new Error('No user found with email: user@example.com');
}

// RIGHT - Generic error message
if (!user) {
  throw new Error('Invalid credentials');
}
```

## Further Reading

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [GraphQL Authorization Best Practices](https://www.apollographql.com/docs/apollo-server/security/authentication/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)

## Summary

Implementing proper authentication and authorization is critical for API security. Key takeaways:

1. Always verify authentication before processing requests
2. Check authorization before accessing or modifying resources
3. Use JWT tokens with version control for revocation
4. Implement role-based access control for permissions
5. Secure tokens using httpOnly cookies for refresh tokens
6. Hash passwords with bcrypt (minimum 12 rounds)
7. Rate limit authentication attempts
8. Log security-critical operations
9. Test authorization logic thoroughly
10. Follow the principle of least privilege

By following these patterns and best practices, you ensure that the Talawa API maintains a robust security posture while providing a good developer experience.
