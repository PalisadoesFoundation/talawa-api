const User = require('../../models/User');
const { filterParamUtil, orderByFilter } = require('./users_utils');

const usersConnection = async (parent, args) => {
  var inputArg = {};
  var isSortingExecuted = args.orderBy !== null;
  const filterParam = args.where;

  if (filterParam) {
    inputArg = filterParamUtil(filterParam);
  }

  var sort = {};
  if (isSortingExecuted) {
    sort = orderByFilter(args.orderBy);
  }

  const users = await User.find(inputArg)
    .sort(sort)
    .limit(args.first)
    .skip(args.skip)
    .populate('createdOrganizations')
    .populate('createdEvents')
    .populate('joinedOrganizations')
    .populate('registeredEvents')
    .populate('eventAdmin')
    .populate('adminFor');

  return users.map((user) => {
    return {
      ...user._doc,
      password: null,
    };
  });
};

const organizationsMemberConnection = async (parent, args) => {
  var inputArg = {};
  var sort = {};

  if (args.where) {
    inputArg = filterParamUtil(args.where);
  }

  if (args.orderBy) {
    sort = orderByFilter(args.orderBy);
  }

  // Pagination based Options
  var options = {};
  if (args.first) {
    if (args.skip === null) {
      throw 'Missing Skip parameter. Set it to either 0 or some other value';
    }

    options = {
      lean: true,
      sort: sort,
      pagination: true,
      page: args.skip,
      limit: args.first,
    };
  } else {
    options = {
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
    options
  );

  var users = {};
  if (options.pagination) {
    if (args.skip === undefined) {
      throw new Error('Skip parameter is missing');
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

module.exports = {
  usersConnection: usersConnection,
  organizationsMemberConnection: organizationsMemberConnection,
};
