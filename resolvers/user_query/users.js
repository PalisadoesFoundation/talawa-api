const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const User = require('../../models/User');

module.exports = async (parent, args) => {
  var sort = {};
  var isSortingExecuted = args.orderBy !== null;

  if (isSortingExecuted) {
    if (args.orderBy === 'id_ASC') {
      sort = { _id: 1 };
    } else if (args.orderBy === 'id_DESC') {
      sort = { _id: -1 };
    } else if (args.orderBy === 'firstName_ASC') {
      sort = { firstName: 1 };
    } else if (args.orderBy === 'firstName_DESC') {
      sort = { firstName: -1 };
    } else if (args.orderBy === 'lastName_ASC') {
      sort = { lastName: 1 };
    } else if (args.orderBy === 'lastName_DESC') {
      sort = { lastName: -1 };
    } else if (args.orderBy === 'email_ASC') {
      sort = { email: 1 };
    } else {
      sort = { email: -1 };
    }
  }
  if (args.id) {
    const users = await User.find({ _id: args.id })
      .sort(sort)
      .populate('createdOrganizations')
      .populate('createdEvents')
      .populate('joinedOrganizations')
      .populate('registeredEvents')
      .populate('eventAdmin')
      .populate('adminFor');
    if (!users[0]) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    } else
      return users.map((user) => {
        return {
          ...user._doc,
          password: null,
        };
      });
  } else {
    const users = await User.find()
      .sort(sort)
      .populate('createdOrganizations')
      .populate('createdEvents')
      .populate('joinedOrganizations')
      .populate('registeredEvents')
      .populate('eventAdmin')
      .populate('adminFor');
    return users.map((user) => {
      return { ...user._doc, password: null };
    });
  }
};
