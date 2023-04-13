import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { InterfacePost, Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
import { graphqlConnectionFactory } from "../../utilities";
import { Types } from "mongoose";

// @ts-ignore
/**
 * This query will retrieve from the database a list of posts
 * in the organisation under the specified limit for the specified page in the pagination.
 * @param _parent-
 * @param args - An object holds the data required to execute the query.
 * `args.first` specifies the number of members to retrieve, and `args.after` specifies
 * the cursor after which the results we want to fetch and `args.before` sepcifies the
 * cursor before which the results we want to fetch.
 * @returns A connection object containing edges and pagination information.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const postsByOrganizationConnection: QueryResolvers["postsByOrganizationConnection"] =
  async (_parent, args) => {
    let sort = getSort(args.orderBy);
    let where = getWhere<InterfacePost>(args.where);

    where = {
      ...where,
      organization: args.id,
    };

    // Set default value for args.first
    if (!args.first) {
      args.first = 10;
    }

    let orderField = "_id";
    let order = "ASC";

    // Set the orderField and order demanded from the query
    if (args.orderBy) {
      [orderField, order] = args.orderBy.split("_");

      if (orderField === "id") {
        orderField = "_id";
      }
    }

    // Set `where` and `sort` for the next page if args.after is defined
    if (args.after) {
      const [cursorId, ...cursorParamArray] = args.after.split("_");
      const cursorParam = cursorParamArray.join("_");

      const cursorObjectId = new Types.ObjectId(cursorId);

      if (orderField === "_id") {
        // Sort Posts by `_id`
        if (order === "ASC") {
          where = {
            ...where,
            _id: { $gt: cursorId },
          };
        } else if (order === "DESC") {
          where = {
            ...where,
            _id: { $lt: cursorId },
          };
        }
      } else {
        // Sort Posts by `orderField`
        if (order === "ASC") {
          sort = {
            [orderField]: 1,
            _id: 1,
          };

          where = {
            ...where,
            $or: [
              { [orderField]: { $gt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $gt: cursorObjectId },
              },
            ],
          };
        } else if (order === "DESC") {
          sort = {
            [orderField]: -1,
            _id: -1,
          };

          where = {
            ...where,
            $or: [
              { [orderField]: { $lt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $lt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }
    }

    // Set `where` and `sort` for the previous page if args.before is defined
    if (args.before) {
      const [cursorId, ...cursorParamArray] = args.before.split("_");
      const cursorParam = cursorParamArray.join("_");

      if (orderField === "_id") {
        // Sort Posts by _id.
        if (order === "ASC") {
          sort = {
            _id: -1,
          };

          where = {
            ...where,
            _id: { $lt: cursorId },
          };
        } else if (order === "DESC") {
          sort = {
            _id: 1,
          };

          where = {
            ...where,
            _id: { $gt: cursorId },
          };
        }
      } else {
        // Sort Posts by `orderField`
        if (order === "ASC") {
          sort = {
            [orderField]: -1,
            _id: -1,
          };

          where = {
            ...where,
            $or: [
              { [orderField]: { $lt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $lt: Types.ObjectId(cursorId) },
              },
            ],
          };
        } else if (order === "DESC") {
          sort = {
            [orderField]: 1,
            _id: 1,
          };

          where = {
            ...where,
            $or: [
              { [orderField]: { $gt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $gt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }
    }

    const posts = await Post.find(where)
      .sort(sort)
      .limit(args.first)
      .populate("creator")
      .lean();

    const edges = posts.map((post) => {
      let cursor: string = post._id.toString();

      if (orderField === "title") {
        cursor += "_" + post.title;
      }

      if (orderField === "createdAt") {
        cursor += "_" + post.createdAt.toISOString();
      }

      const edge = {
        cursor,
        node: post,
      };

      return edge;
    });

    // Reverse the results to get correct order of `result` if args.before is defined
    if (args.before) {
      edges.reverse();
    }

    // Generate the GraphQL connection
    const result = graphqlConnectionFactory<InterfacePost>();

    result.edges = edges;

    where = getWhere<InterfacePost>(args.where);

    if (edges.length) {
      // Set hasNextPage for the result
      if (order === "DESC") {
        if (orderField === "_id") {
          where = {
            ...where,
            _id: { $lt: edges[edges.length - 1].cursor },
          };
        } else {
          const [cursorId, cursorParam] =
            edges[edges.length - 1].cursor.split("_");

          where = {
            ...where,
            $or: [
              { [orderField]: { $lt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $lt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }

      if (order === "ASC") {
        if (orderField === "_id") {
          where = {
            ...where,
            _id: { $gt: edges[edges.length - 1].cursor },
          };
        } else {
          const [cursorId, cursorParam] =
            edges[edges.length - 1].cursor.split("_");

          where = {
            ...where,
            $or: [
              { [orderField]: { $gt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $gt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }

      result.pageInfo.hasNextPage = !!(await Post.exists(where));

      // Set hasPreviousPage for the result
      if (order === "DESC") {
        if (orderField === "_id") {
          where = {
            ...where,
            _id: { $gt: edges[0].cursor },
          };
        } else {
          const [cursorId, ...cursorParamArray] = edges[0].cursor.split("_");
          const cursorParam = cursorParamArray.join("_");

          where = {
            ...where,
            $or: [
              { [orderField]: { $gt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $gt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }

      if (order === "ASC") {
        if (orderField === "_id") {
          where = {
            ...where,
            _id: { $lt: edges[0].cursor },
          };
        } else {
          const [cursorId, ...cursorParamArray] = edges[0].cursor.split("_");
          const cursorParam = cursorParamArray.join("_");

          where = {
            ...where,
            $or: [
              { [orderField]: { $lt: cursorParam } },
              {
                [orderField]: cursorParam,
                _id: { $lt: Types.ObjectId(cursorId) },
              },
            ],
          };
        }
      }

      result.pageInfo.hasPreviousPage = !!(await Post.exists(where));
    }

    // Set the endCursor and StartCursor for the result
    if (edges.length) {
      result.pageInfo.endCursor = edges[edges.length - 1].cursor;
      result.pageInfo.startCursor = edges[0].cursor;
    }

    return result;
  };
