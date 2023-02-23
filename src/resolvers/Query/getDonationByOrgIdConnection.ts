import {
  DonationWhereInput,
  InputMaybe,
  QueryResolvers,
} from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * @name getDonationByOrgIdConnection a GraphQL Query
 * @description returns list of donations as a transactions that matches the provided orgId property from database and all the query parameters
 */
export const getDonationByOrgIdConnection: QueryResolvers["getDonationByOrgIdConnection"] =
  async (_parent, args) => {
    const inputArg = getInputArg(args.where);

    return await Donation.find({
      orgId: args.orgId,
      ...inputArg,
    })
      .limit(args.first!)
      .skip(args.skip!)
      .lean();
  };

const getInputArg = (where: InputMaybe<DonationWhereInput> | undefined) => {
  let inputArg = {};

  if (where) {
    // Returns provided id event
    if (where.id) {
      inputArg = {
        ...inputArg,
        _id: where.id,
      };
    }

    // Returns all events other than provided id
    if (where.id_not) {
      inputArg = {
        ...inputArg,
        _id: { $ne: where.id_not },
      };
    }

    // Return events with id in the provided list
    if (where.id_in) {
      inputArg = {
        ...inputArg,
        _id: { $in: where.id_in },
      };
    }

    // Returns events not included in provided id list
    if (where.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: { $nin: where.id_not_in },
      };
    }

    // Returns provided name events
    if (where.name_of_user) {
      inputArg = {
        ...inputArg,
        nameOfUser: where.name_of_user,
      };
    }

    // Returns events with not that name_of_user
    if (where.name_of_user_not) {
      inputArg = {
        ...inputArg,
        nameOfUser: { $ne: where.name_of_user_not },
      };
    }

    // Return events with the given list name_of_user
    if (where.name_of_user_in) {
      inputArg = {
        ...inputArg,
        nameOfUser: { $in: where.name_of_user_in },
      };
    }

    // Returns events with name_of_user not in the provided list
    if (where.name_of_user_not_in) {
      inputArg = {
        ...inputArg,
        nameOfUser: { $nin: where.name_of_user_not_in },
      };
    }

    // Returns events with name_of_user containing provided string
    if (where.name_of_user_contains) {
      inputArg = {
        ...inputArg,
        nameOfUser: { $regex: where.name_of_user_contains, $options: "i" },
      };
    }

    // Returns events with name_of_user starts with that provided string
    if (where.name_of_user_starts_with) {
      const regexp = new RegExp("^" + where.name_of_user_starts_with);
      inputArg = {
        ...inputArg,
        nameOfUser: regexp,
      };
    }

    return inputArg;
  }
};
