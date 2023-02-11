import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { errors } from "../../libraries";
import { DirectChat } from "../../models";

export const directChatsByUserID: QueryResolvers["directChatsByUserID"] =
  async (_parent, args) => {
    const directChats = await DirectChat.find({
      users: args.id,
    }).lean();

    if (directChats.length === 0) {
      throw new errors.NotFoundError(
        "DirectChats not found",
        "directChats.notFound",
        "directChats"
      );
    }

    return directChats;
  };
