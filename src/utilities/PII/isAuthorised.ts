import type { User } from "../../types/generatedGraphQLTypes";

/**
 * Checks if the requesting user is authorized to access or modify the requested user's data.
 * @param requestingUser - The user making the request.
 * @param requestedUser - The user whose data is being requested or modified.
 * @returns `true` if the requesting user is authorized, `false` otherwise.
 */
export function isAuthorised(
  requestingUser: User,
  requestedUser: User,
): boolean {
  // Check if the requesting user is the same as the requested user
  if (requestedUser !== requestedUser) {
    return false; // Not authorized if requesting user is not the same as requested user
  }

  return true; // Authorized if requesting user is the same as requested user
}
