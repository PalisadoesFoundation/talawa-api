import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { DirectChat } from "../../models";
import { IN_PRODUCTION } from "../../../constants";

/**
 * This query will fetch all the Direct chats for the current user from the database.
 * @param _parent 
 * @param args - An object that contains `id` of the user.
 * @returns An object `directChats` that contains all direct chats of the current user. 
 * If the `directChats` object is null then it throws `NotFoundError` error. 
 * @remarks You can learn about GraphQL `Resolvers` 
 * {@link https://www.apollographql.com/docs/apollo-server/data/resolvers/ | here}.
 */
export const directChatsByUserID: QueryResolvers["directChatsByUserID"] =
  async (_parent, args) => {
    const directChats = await DirectChat.find({
      users: args.id,
    }).lean();

    if (directChats.length === 0) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? "DirectChats not found"
          : requestContext.translate("directChats.notFound"),
        "directChats.notFound",
        "directChats"
      );
    }

    return directChats;
  };
