import {
  InputMaybe,
  QueryResolvers,
  UserWhereInput,
} from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { getSort } from "./helper_funtions/getSort";

// @ts-ignore
export const organizationsMemberConnection: QueryResolvers["organizationsMemberConnection"] =
  async (_parent, args) => {
    const inputArg = getInputArg(args.where);
    const sort = getSort(args.orderBy);

    // Pagination based Options
    let paginateOptions;

    if (args.first) {
      if (args.skip === null) {
        throw "Missing Skip parameter. Set it to either 0 or some other value";
      }

      paginateOptions = {
        lean: true,
        sort: sort,
        pagination: true,
        page: args.skip,
        limit: args.first,
      };
    } else {
      paginateOptions = {
        sort: sort,
        pagination: false,
      };
    }

    const usersModel = await User.paginate(
      {
        joinedOrganizations: {
          _id: args.orgId,
        },
        ...inputArg,
      },
      {
        ...paginateOptions,
        select: ["-password"],
      }
    );

    let users = {};

    if (paginateOptions.pagination) {
      if (args.skip === undefined) {
        throw new Error("Skip parameter is missing");
      }

      users = usersModel.docs.map((user) => {
        return {
          ...user,
          password: null,
        };
      });
    } else {
      users = usersModel.docs.map((user) => {
        return {
          ...user._doc,
          password: null,
        };
      });
    }

    return {
      pageInfo: {
        hasNextPage: usersModel.hasNextPage,
        hasPreviousPage: usersModel.hasPrevPage,
        totalPages: usersModel.totalPages,
        nextPageNo: usersModel.nextPage,
        prevPageNo: usersModel.prevPage,
        currPageNo: usersModel.page,
      },
      edges: users,
      aggregate: {
        count: usersModel.totalDocs,
      },
    };
  };

const getInputArg = (where: InputMaybe<UserWhereInput> | undefined) => {
  let inputArg = {};

  if (where) {
    if (where.id) {
      inputArg = {
        ...inputArg,
        _id: where.id,
      };
    }

    //Returns all user other than provided id
    if (where.id_not) {
      inputArg = {
        ...inputArg,
        _id: {
          $ne: where.id_not,
        },
      };
    }

    //Return users with id in the provided list
    if (where.id_in) {
      inputArg = {
        ...inputArg,
        _id: {
          $in: where.id_in,
        },
      };
    }

    //Returns user not included in provided id list
    if (where.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: {
          $nin: where.id_not_in,
        },
      };
    }

    //Returns provided firstName user
    if (where.firstName) {
      inputArg = {
        ...inputArg,
        firstName: where.firstName,
      };
    }

    //Returns user with not that firstName
    if (where.firstName_not) {
      inputArg = {
        ...inputArg,
        firstName: {
          $ne: where.firstName_not,
        },
      };
    }

    //Return users with the given list firstName
    if (where.firstName_in) {
      inputArg = {
        ...inputArg,
        firstName: {
          $in: where.firstName_in,
        },
      };
    }

    //Returns users with firstName not in the provided list
    if (where.firstName_not_in) {
      inputArg = {
        ...inputArg,
        firstName: {
          $nin: where.firstName_not_in,
        },
      };
    }

    //Returns users with first name containing provided string
    if (where.firstName_contains) {
      inputArg = {
        ...inputArg,
        firstName: {
          $regex: where.firstName_contains,
          $options: "i",
        },
      };
    }

    //Returns users with firstName starts with that provided string
    if (where.firstName_starts_with) {
      const regexp = new RegExp("^" + where.firstName_starts_with);
      inputArg = {
        ...inputArg,
        firstName: regexp,
      };
    }

    //Returns lastName user
    if (where.lastName) {
      inputArg = {
        ...inputArg,
        lastName: where.lastName,
      };
    }

    //Returns user with not that lastName
    if (where.lastName_not) {
      inputArg = {
        ...inputArg,
        lastName: {
          $ne: where.lastName_not,
        },
      };
    }

    //Return users with lastName in provided list
    if (where.lastName_in) {
      inputArg = {
        ...inputArg,
        lastName: {
          $in: where.lastName_in,
        },
      };
    }

    //Return users with lastName not in provided list
    if (where.lastName_not_in) {
      inputArg = {
        ...inputArg,
        lastName: {
          $nin: where.lastName_not_in,
        },
      };
    }

    //Return users with lastName should containing provided string
    if (where.lastName_contains) {
      inputArg = {
        ...inputArg,
        lastName: {
          $regex: where.lastName_contains,
          $options: "i",
        },
      };
    }

    //Returns users with LastName starting with provided string
    if (where.lastName_starts_with) {
      const regexp = new RegExp("^" + where.lastName_starts_with);
      inputArg = {
        ...inputArg,
        lastName: regexp,
      };
    }

    //Returns provided email user
    if (where.email) {
      inputArg = {
        ...inputArg,
        email: where.email,
      };
    }

    //Returns user with not that provided email
    if (where.email_not) {
      inputArg = {
        ...inputArg,
        email: {
          $ne: where.email_not,
        },
      };
    }

    //User email falls in provided list
    if (where.email_in) {
      inputArg = {
        ...inputArg,
        email: {
          $in: where.email_in,
        },
      };
    }

    //Return User email not falls in the list
    if (where.email_not_in) {
      inputArg = {
        ...inputArg,
        email: {
          $nin: where.email_not_in,
        },
      };
    }

    //Return users with email containing provided string
    if (where.email_contains) {
      inputArg = {
        ...inputArg,
        email: {
          $regex: where.email_contains,
          $options: "i",
        },
      };
    }

    //Returns user with email starts with provided string
    if (where.email_starts_with) {
      const regexp = new RegExp("^" + where.email_starts_with);
      inputArg = {
        ...inputArg,
        email: regexp,
      };
    }

    //Returns provided appLanguageCode user
    if (where.appLanguageCode) {
      inputArg = {
        ...inputArg,
        appLanguageCode: where.appLanguageCode,
      };
    }

    //Returns user with not that provided appLanguageCode
    if (where.appLanguageCode_not) {
      inputArg = {
        ...inputArg,
        appLanguageCode: {
          $ne: where.appLanguageCode_not,
        },
      };
    }

    //User appLanguageCode falls in provided list
    if (where.appLanguageCode_in) {
      inputArg = {
        ...inputArg,
        appLanguageCode: {
          $in: where.appLanguageCode_in,
        },
      };
    }

    //Return User appLanguageCode not falls in the list
    if (where.appLanguageCode_not_in) {
      inputArg = {
        ...inputArg,
        appLanguageCode: {
          $nin: where.appLanguageCode_not_in,
        },
      };
    }

    //Return users with appLanguageCode containing provided string
    if (where.appLanguageCode_contains) {
      inputArg = {
        ...inputArg,
        appLanguageCode: {
          $regex: where.appLanguageCode_contains,
          $options: "i",
        },
      };
    }

    //Returns user with appLanguageCode starts with provided string
    if (where.appLanguageCode_starts_with) {
      const regexp = new RegExp("^" + where.appLanguageCode_starts_with);
      inputArg = {
        ...inputArg,
        appLanguageCode: regexp,
      };
    }
  }

  return inputArg;
};
