import {
  InputMaybe,
  PostWhereInput,
  QueryResolvers,
} from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";

// @ts-ignore
/**
 * This query will retrieve from the database a list of posts
 * in the organisation under the specified limit for the specified page in the pagination.
 * @param _parent
 * @param args - An object holds the data required to execute the query.
 * `args.first` specifies the number of members to retrieve, and `args.after` specifies
 * the unique identification for each item in the returned list.
 * @returns An object containing the list of posts and pagination information.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const postsByOrganizationConnection: QueryResolvers["postsByOrganizationConnection"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);
    const inputArg = getInputArg(args.where);

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

const getInputArg = (where: InputMaybe<PostWhereInput> | undefined) => {
  let inputArg = {};

  if (where) {
    if (where.id) {
      inputArg = {
        ...inputArg,
        _id: where.id,
      };
    }

    //Returns all Posts other than provided id
    if (where.id_not) {
      inputArg = {
        ...inputArg,
        _id: {
          $ne: where.id_not,
        },
      };
    }

    //Return Posts with id in the provided list
    if (where.id_in) {
      inputArg = {
        ...inputArg,
        _id: {
          $in: where.id_in,
        },
      };
    }

    //Returns Posts not included in provided id list
    if (where.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: {
          $nin: where.id_not_in,
        },
      };
    }

    //Returns provided text Posts
    if (where.text) {
      inputArg = {
        ...inputArg,
        text: where.text,
      };
    }

    //Returns Posts with not the provided text
    if (where.text_not) {
      inputArg = {
        ...inputArg,
        text: {
          $ne: where.text_not,
        },
      };
    }

    //Return Posts with the given list text
    if (where.text_in) {
      inputArg = {
        ...inputArg,
        text: {
          $in: where.text_in,
        },
      };
    }

    //Returns Posts with text not in the provided list
    if (where.text_not_in) {
      inputArg = {
        ...inputArg,
        text: {
          $nin: where.text_not_in,
        },
      };
    }

    //Returns Posts with text containing provided string
    if (where.text_contains) {
      inputArg = {
        ...inputArg,
        text: {
          $regex: where.text_contains,
          $options: "i",
        },
      };
    }

    //Returns Posts with text starts with that provided string
    if (where.text_starts_with) {
      const regexp = new RegExp("^" + where.text_starts_with);
      inputArg = {
        ...inputArg,
        text: regexp,
      };
    }

    //Returns provided title Posts
    if (where.title) {
      inputArg = {
        ...inputArg,
        title: where.title,
      };
    }

    //Returns Posts with not that title
    if (where.title_not) {
      inputArg = {
        ...inputArg,
        title: {
          $ne: where.title_not,
        },
      };
    }

    //Return Posts with the given list title
    if (where.title_in) {
      inputArg = {
        ...inputArg,
        title: {
          $in: where.title_in,
        },
      };
    }

    //Returns Posts with title not in the provided list
    if (where.title_not_in) {
      inputArg = {
        ...inputArg,
        title: {
          $nin: where.title_not_in,
        },
      };
    }

    //Returns Posts with title containing provided string
    if (where.title_contains) {
      inputArg = {
        ...inputArg,
        title: {
          $regex: where.title_contains,
          $options: "i",
        },
      };
    }

    //Returns Posts with title starts with that provided string
    if (where.title_starts_with) {
      const regexp = new RegExp("^" + where.title_starts_with);
      inputArg = {
        ...inputArg,
        title: regexp,
      };
    }
  }

  return inputArg;
};
