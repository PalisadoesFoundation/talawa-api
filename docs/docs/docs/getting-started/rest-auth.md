---
id: rest-auth
title: REST Authentication
slug: /getting-started/rest-auth
sidebar_position: 5
---

## Overview

Talawa API provides REST-first authentication via HTTP endpoints that issue and refresh JWT tokens and set HttpOnly cookies. Use these endpoints when building web or mobile clients that authenticate with the API.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Register a new user with email and password. On success, signs the user in and sets auth cookies. |
| POST | `/auth/signin` | Sign in with email and password. Returns user info and sets access and refresh cookies. |
| POST | `/auth/refresh` | Exchange a valid refresh token (from cookie or body) for new access and refresh tokens; updates cookies. |
| POST | `/auth/logout` | Clear auth cookies and revoke the refresh token. |

All auth endpoints use the **`auth`** rate limit (see [Rate limiting](#rate-limiting)).

## Authentication flow

### Sign-in

1. Client sends `POST /auth/signin` with JSON body: `{ "email": "...", "password": "..." }`.
2. Server validates credentials and, on success, responds with:
   - **Set-Cookie** headers for access and refresh tokens (HttpOnly, configurable domain and secure flags).
   - Optional JSON body with user data (e.g. `{ "user": { "id", "email" } }`).
3. Subsequent requests to protected REST routes send the access token via cookie (or `Authorization` if implemented); the server uses `preHandler: app.requireAuth()` to enforce authentication.

### Refresh

1. When the access token expires, the client sends `POST /auth/refresh` with:
   - The refresh token in the `Set-Cookie` request (preferred), or
   - JSON body: `{ "refreshToken": "..." }`.
2. Server validates the refresh token, issues new access and refresh tokens, and responds with updated **Set-Cookie** headers (and optionally `{ "ok": true }`).
3. Client continues using the new cookies for authenticated requests.

### Logout

1. Client sends `POST /auth/logout` (cookies are sent automatically).
2. Server revokes the refresh token and clears auth cookies.

## Rate limiting

Auth endpoints use the **auth** rate limit tier (configured in `src/config/rateLimits.ts`), which restricts the number of requests per minute to these routes. This helps prevent brute-force and abuse.

## Environment and security checklist

When using REST auth, configure and verify the following:

| Item | Description |
|------|-------------|
| **API_AUTH_JWT_SECRET** | Strong symmetric secret for signing REST access/refresh tokens. At least 32 characters. **Required in production** when using REST auth. |
| **API_ACCESS_TOKEN_TTL** | Access token TTL in seconds (e.g. `900` for 15 minutes). Default: `900`. |
| **API_REFRESH_TOKEN_TTL** | Refresh token TTL in seconds (e.g. `2592000` for 30 days). Default: `2592000`. |
| **API_COOKIE_SECRET** | Required for `@fastify/cookie` signing; at least 32 characters. Used by auth routes for Set-Cookie. |
| **API_COOKIE_DOMAIN** | Optional. Set for cross-subdomain cookies (e.g. `.example.com`). Omit for same-origin only. |
| **API_IS_SECURE_COOKIES** | Optional. Set to `true` in production (HTTPS); can be `false` for local/dev. |
| **Server bootstrap** | `@fastify/cookie` is registered in `createServer.ts`; no extra setup needed. |
| **Protected REST** | Use `preHandler: app.requireAuth()` on REST routes that require authentication. |
| **GraphQL** | Existing `ctx.currentUser` and auth checks apply; GraphQL uses `API_JWT_SECRET`, not `API_AUTH_JWT_SECRET`. |

For full variable names, defaults, and details, see [Configuration Variables](./environment-variables.md).
