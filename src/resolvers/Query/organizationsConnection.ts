import {
  InputMaybe,
  OrganizationWhereInput,
  QueryResolvers,
} from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { getSort } from "./helperFunctions/getSort";

export const organizationsConnection: QueryResolvers["organizationsConnection"] =
  async (_parent, args) => {
    const inputArg = getInputArg(args.where);
    const sort = getSort(args.orderBy);

    const organizations = await Organization.find(inputArg)
      .sort(sort)
      .limit(args.first!)
      .skip(args.skip!)
      .lean();

    return organizations;
  };

const getInputArg = (where: InputMaybe<OrganizationWhereInput> | undefined) => {
  let inputArg = {};

  if (where) {
    // Returns provided id organizations
    if (where.id) {
      inputArg = {
        ...inputArg,
        _id: where.id,
      };
    }

    // Returns all organizations other than provided id
    if (where.id_not) {
      inputArg = {
        ...inputArg,
        _id: { $ne: where.id_not },
      };
    }

    // Return organizations with id in the provided list
    if (where.id_in) {
      inputArg = {
        ...inputArg,
        _id: { $in: where.id_in },
      };
    }

    // Returns organizations not included in provided id list
    if (where.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: { $nin: where.id_not_in },
      };
    }

    // Returns provided name organization
    if (where.name) {
      inputArg = {
        ...inputArg,
        name: where.name,
      };
    }

    // Returns organizations with not that name
    if (where.name_not) {
      inputArg = {
        ...inputArg,
        name: { $ne: where.name_not },
      };
    }

    // Return organizations with the given list name
    if (where.name_in) {
      inputArg = {
        ...inputArg,
        name: { $in: where.name_in },
      };
    }

    // Returns organizations with name not in the provided list
    if (where.name_not_in) {
      inputArg = {
        ...inputArg,
        name: { $nin: where.name_not_in },
      };
    }

    // Returns organizations with name containing provided string
    if (where.name_contains) {
      inputArg = {
        ...inputArg,
        name: { $regex: where.name_contains, $options: "i" },
      };
    }

    // Returns organizations with name starts with that provided string
    if (where.name_starts_with) {
      const regexp = new RegExp("^" + where.name_starts_with);
      inputArg = {
        ...inputArg,
        name: regexp,
      };
    }

    // Returns description organizations
    if (where.description) {
      inputArg = {
        ...inputArg,
        description: where.description,
      };
    }

    // Returns organizations with not that description
    if (where.description_not) {
      inputArg = {
        ...inputArg,
        description: { $ne: where.description_not },
      };
    }

    // Return organizations with description in provided list
    if (where.description_in) {
      inputArg = {
        ...inputArg,
        description: { $in: where.description_in },
      };
    }

    // Return organizations with description not in provided list
    if (where.description_not_in) {
      inputArg = {
        ...inputArg,
        description: { $nin: where.description_not_in },
      };
    }

    // Return organizations with description should containing provided string
    if (where.description_contains) {
      inputArg = {
        ...inputArg,
        description: {
          $regex: where.description_contains,
          $options: "i",
        },
      };
    }

    // Returns organizations with description starting with provided string
    if (where.description_starts_with) {
      const regexp = new RegExp("^" + where.description_starts_with);
      inputArg = {
        ...inputArg,
        description: regexp,
      };
    }

    // Returns provided apiUrl organizations
    if (where.apiUrl) {
      inputArg = {
        ...inputArg,
        apiUrl: where.apiUrl,
      };
    }

    // Returns organizations with not that provided apiUrl
    if (where.apiUrl_not) {
      inputArg = {
        ...inputArg,
        apiUrl: { $ne: where.apiUrl_not },
      };
    }

    // Organizations apiUrl falls in provided list
    if (where.apiUrl_in) {
      inputArg = {
        ...inputArg,
        apiUrl: { $in: where.apiUrl_in },
      };
    }

    // Return organizations apiUrl not falls in the list
    if (where.apiUrl_not_in) {
      inputArg = {
        ...inputArg,
        apiUrl: { $nin: where.apiUrl_not_in },
      };
    }

    // Return organizations with apiUrl containing provided string
    if (where.apiUrl_contains) {
      inputArg = {
        ...inputArg,
        apiUrl: { $regex: where.apiUrl_contains, $options: "i" },
      };
    }

    // Returns organizations with apiUrl starts with provided string
    if (where.apiUrl_starts_with) {
      const regexp = new RegExp("^" + where.apiUrl_starts_with);
      inputArg = {
        ...inputArg,
        apiUrl: regexp,
      };
    }

    // Returns organizations with provided visibleInSearch condition
    if (where.visibleInSearch !== undefined) {
      inputArg = {
        ...inputArg,
        visibleInSearch: where.visibleInSearch,
      };
    }

    // Returns organizations with provided isPublic condition
    if (where.isPublic !== undefined) {
      inputArg = {
        ...inputArg,
        isPublic: where.isPublic,
      };
    }
  }

  return inputArg;
};
