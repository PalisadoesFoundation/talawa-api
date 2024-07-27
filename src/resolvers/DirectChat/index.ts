import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

/**
 * Resolver function for the `DirectChat` type.
 *
 * This resolver is used to resolve the fields of a `DirectChat` type.
 *
 * @see users - The resolver function for the `users` field of a `DirectChat`.
 * @see organization - The resolver function for the `organization` field of a `DirectChat`.
 * @see messages - The resolver function for the `messages` field of a `DirectChat`.
 * @see creator - The resolver function for the `creator` field of a `DirectChat`.
 * @see DirectChatResolvers - The type definition for the resolvers of the DirectChat fields.
 *
 */
export const DirectChat: DirectChatResolvers = {
  creator,
  messages,
  organization,
  users,
};
