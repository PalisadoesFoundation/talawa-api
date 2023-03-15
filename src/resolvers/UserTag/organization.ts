import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { OrganizationTagUser } from "../../models";

export const organization: UserTagResolvers["organization"] = async (
  parent
) => {
  const organizationObject = await OrganizationTagUser.findOne({
    _id: parent._id,
  })
    .select({
      organizationId: 1,
    })
    .populate("organizationId")
    .lean();
  return organizationObject!.organizationId;
};
