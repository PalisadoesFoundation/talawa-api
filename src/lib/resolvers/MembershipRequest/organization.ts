import { MembershipRequestResolvers } from "../../../generated/graphqlCodegen";
import { Organization } from "../../models";

/**
 * This resolver function will get and return the organisation from the database for which a membership request was sent.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the Organization data.
 */
export const organization: MembershipRequestResolvers["organization"] = async (
  parent
) => {
  return Organization.findOne({
    _id: parent.organization,
  }).lean();
};
