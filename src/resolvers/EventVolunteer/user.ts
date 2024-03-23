import { User } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

export const user: EventVolunteerResolvers["user"] = async (parent) => {
  const result = await User.findOne({
    _id: parent.userId,
  }).lean();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};
