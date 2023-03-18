import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_User, User } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

// @ts-ignore
export const organizationsMemberConnection: QueryResolvers["organizationsMemberConnection"] =
  async (_parent, args) => {
    const inputArg: FilterQuery<Interface_User> = getInputArgs(args.where);
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
        populate: ["registeredEvents"],
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
