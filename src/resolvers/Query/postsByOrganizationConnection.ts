import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Interface_Post, Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getInputArgs } from "./helperFunctions/getInputArgs";
import { FilterQuery } from "mongoose";

// @ts-ignore
export const postsByOrganizationConnection: QueryResolvers["postsByOrganizationConnection"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);
    const inputArg: FilterQuery<Interface_Post> = getInputArgs(args.where);

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
        ...inputArg,
      },
      options
    );

    const posts = postsmodel.docs.map((post) => {
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
