import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

// @ts-ignore
/**
 * This query will retrieve from the database a list of posts
 * in the organisation under the specified limit for the specified page in the pagination.
 * @param _parent-
 * @param args - An object holds the data required to execute the query.
 * `args.first` specifies the number of members to retrieve, and `args.after` specifies
 * the unique identification for each item in the returned list.
 * @returns An object containing the list of posts and pagination information.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const postsByOrganizationConnection: QueryResolvers["postsByOrganizationConnection"] =
  async (_parent, args, context) => {
    const sort = getSort(args.orderBy);
    const where = getWhere<InterfacePost>(args.where);

    // Pagination based Options
    let options = {};
    if (args.first) {
      if (args.skip === null) {
        throw "parameter.missing";
      }

      options = {
        lean: true,
        sort: sort,
        pagination: true,
        page: args.skip,
        limit: args.first,
        populate: ["organization", "likedBy", "comments", "creator"],
      };
    } else {
      options = {
        sort: sort,
        pagination: false,
        populate: ["organization", "likedBy", "comments", "creator"],
      };
    }

    const postsmodel = await Post.paginate(
      {
        organization: args.id,
        ...where,
      },
      options
    );

    const posts = postsmodel.docs.map((post) => {
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;
      post.imageUrl = post.imageUrl
        ? `${context.apiRootUrl}${post.imageUrl}`
        : null;

      return post;
    });

    return {
      pageInfo: {
        hasNextPage: postsmodel.hasNextPage,
        hasPreviousPage: postsmodel.hasPrevPage,
        totalPages: postsmodel.totalPages,
        nextPageNo: postsmodel.nextPage,
        prevPageNo: postsmodel.prevPage,
        currPageNo: postsmodel.page,
      },
      edges: posts,
      aggregate: {
        count: postsmodel.totalDocs,
      },
    };
  };
