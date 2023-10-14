import type { User } from "../../types/generatedGraphQLTypes";

export function isAuthorised(
  requestingUser: User,
  requestedUser: User
): boolean {
  return true;
}
