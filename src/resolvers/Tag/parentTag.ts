import { TagResolvers } from "../../types/generatedGraphQLTypes";
import { Tag } from "../../models";

export const parentTag: TagResolvers["parentTag"] = async (parent) => {
  const tag = await Tag.findOne({
    _id: parent._id,
  }).lean();

  return await Tag.findOne({
    _id: tag!.parentTagId,
  }).lean()!;
};
