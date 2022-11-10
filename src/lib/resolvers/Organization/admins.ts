import { User } from "../../models";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";

export const admins: OrganizationResolvers["admins"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.admins,
    },
  }).lean();
};
