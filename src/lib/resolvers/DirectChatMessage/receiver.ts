import { DirectChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

/**
 * This resolver function will fetch and return the receiver(user) of the Direct chat from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains User's data.
 */
export const receiver: DirectChatMessageResolvers["receiver"] = async (
  parent
) => {
  return await User.findOne({
    _id: parent.receiver,
  }).lean();
};
