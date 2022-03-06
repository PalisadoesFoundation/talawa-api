const { ValidationError } = require('errors');
const Post = require('../../models/Post');
const requestContext = require('talawa-request-context');

const postsByOrganizationConnection = async (parent, args) => {
  var sort = {};
  var inputArg = {};

  const filterParam = args.where;
  var isSortingExecuted = args.orderBy !== null;

  // Sorting List of data
  if (isSortingExecuted) {
    sort = sortingData(args.orderBy);
  }

  // Filtering List of data
  if (filterParam) {
    inputArg = filteringData(filterParam);
  }

  // Pagination based Options
  var options = {};
  if (args.first) {
    if (args.skip === null) {
      throw new ValidationError(
        requestContext.translate('parameter.missing'),
        'parameter.missing',
        'parameter'
      );
    }

    options = {
      lean: true,
      sort: sort,
      pagination: true,
      page: args.skip,
      limit: args.first,
      populate: ['organization', 'likedBy', 'comments'],
    };
  } else {
    options = {
      sort: sort,
      pagination: false,
      populate: ['organization', 'likedBy', 'comments'],
    };
  }

  // Set of posts
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

const filteringData = (filterParam) => {
  var inputArg = {};
  if (filterParam.id) {
    inputArg = {
      ...inputArg,
      _id: filterParam.id,
    };
  }

  //Returns all Posts other than provided id
  if (filterParam.id_not) {
    inputArg = {
      ...inputArg,
      _id: {
        $ne: filterParam.id_not,
      },
    };
  }

  //Return Posts with id in the provided list
  if (filterParam.id_in) {
    inputArg = {
      ...inputArg,
      _id: {
        $in: filterParam.id_in,
      },
    };
  }

  //Returns Posts not included in provided id list
  if (filterParam.id_not_in) {
    inputArg = {
      ...inputArg,
      _id: {
        $nin: filterParam.id_not_in,
      },
    };
  }

  //Returns provided text Posts
  if (filterParam.text) {
    inputArg = {
      ...inputArg,
      text: filterParam.text,
    };
  }

  //Returns Posts with not the provided text
  if (filterParam.text_not) {
    inputArg = {
      ...inputArg,
      text: {
        $ne: filterParam.text_not,
      },
    };
  }

  //Return Posts with the given list text
  if (filterParam.text_in) {
    inputArg = {
      ...inputArg,
      text: {
        $in: filterParam.text_in,
      },
    };
  }

  //Returns Posts with text not in the provided list
  if (filterParam.text_not_in) {
    inputArg = {
      ...inputArg,
      text: {
        $nin: filterParam.text_not_in,
      },
    };
  }

  //Returns Posts with text containing provided string
  if (filterParam.text_contains) {
    inputArg = {
      ...inputArg,
      text: {
        $regex: filterParam.text_contains,
        $options: 'i',
      },
    };
  }

  //Returns Posts with text starts with that provided string
  if (filterParam.text_starts_with) {
    const regexp = new RegExp('^' + filterParam.text_starts_with);
    inputArg = {
      ...inputArg,
      text: regexp,
    };
  }

  //Returns provided title Posts
  if (filterParam.title) {
    inputArg = {
      ...inputArg,
      title: filterParam.title,
    };
  }

  //Returns Posts with not that title
  if (filterParam.title_not) {
    inputArg = {
      ...inputArg,
      title: {
        $ne: filterParam.title_not,
      },
    };
  }

  //Return Posts with the given list title
  if (filterParam.title_in) {
    inputArg = {
      ...inputArg,
      title: {
        $in: filterParam.title_in,
      },
    };
  }

  //Returns Posts with title not in the provided list
  if (filterParam.title_not_in) {
    inputArg = {
      ...inputArg,
      title: {
        $nin: filterParam.title_not_in,
      },
    };
  }

  //Returns Posts with title containing provided string
  if (filterParam.title_contains) {
    inputArg = {
      ...inputArg,
      title: {
        $regex: filterParam.title_contains,
        $options: 'i',
      },
    };
  }

  //Returns Posts with title starts with that provided string
  if (filterParam.title_starts_with) {
    const regexp = new RegExp('^' + filterParam.title_starts_with);
    inputArg = {
      ...inputArg,
      title: regexp,
    };
  }

  return inputArg;
};

const sortingData = (orderBy) => {
  var sort = {};
  var isSortingExecuted = orderBy !== null;

  //Sorting List
  if (isSortingExecuted) {
    if (orderBy === 'id_ASC') {
      sort = {
        _id: 1,
      };
    } else if (orderBy === 'id_DESC') {
      sort = {
        _id: -1,
      };
    } else if (orderBy === 'text_ASC') {
      sort = {
        text: 1,
      };
    } else if (orderBy === 'text_DESC') {
      sort = {
        text: -1,
      };
    } else if (orderBy === 'title_ASC') {
      sort = {
        title: 1,
      };
    } else if (orderBy === 'title_DESC') {
      sort = {
        title: -1,
      };
    } else if (orderBy === 'createdAt_ASC') {
      sort = {
        createdAt: 1,
      };
    } else if (orderBy === 'createdAt_DESC') {
      sort = {
        createdAt: -1,
      };
    } else if (orderBy === 'imageUrl_ASC') {
      sort = {
        imageUrl: 1,
      };
    } else if (orderBy === 'imageUrl_DESC') {
      sort = {
        imageUrl: -1,
      };
    } else if (orderBy === 'videoUrl_ASC') {
      sort = {
        videoUrl: 1,
      };
    } else if (orderBy === 'videoUrl_DESC') {
      sort = {
        videoUrl: -1,
      };
    } else if (orderBy === 'likeCount_ASC') {
      sort = {
        likeCount: 1,
      };
    } else if (orderBy === 'likeCount_DESC') {
      sort = {
        likeCount: -1,
      };
    } else if (orderBy === 'commentCount_ASC') {
      sort = {
        commentCount: 1,
      };
    } else {
      sort = {
        commentCount: -1,
      };
    }
  }

  return sort;
};

module.exports = postsByOrganizationConnection;
