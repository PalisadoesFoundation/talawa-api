import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { Tag, Organization } from "../../models";

export const organization: TagResolvers["organization"] = async (parent) => {
  const tag = await Tag.findOne({
    _id: parent._id,
  })
    .select({
      organizationId: 1,
    })
    .lean();

  return await Organization.findOne({
    _id: tag!.organizationId,
  }).lean()!;
};
