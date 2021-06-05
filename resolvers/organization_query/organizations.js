const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Organization = require('../../models/Organization');

module.exports = async (parent, args) => {
  var sort = {};
  var isSortingExecuted = args.orderBy !== null;

  //Sorting List
  if (isSortingExecuted) {
    if (args.orderBy === 'id_ASC') {
      sort = { _id: 1 };
    } else if (args.orderBy === 'id_DESC') {
      sort = { _id: -1 };
    } else if (args.orderBy === 'name_ASC') {
      sort = { name: 1 };
    } else if (args.orderBy === 'name_DESC') {
      sort = { name: -1 };
    } else if (args.orderBy === 'description_ASC') {
      sort = { description: 1 };
    } else if (args.orderBy === 'description_DESC') {
      sort = { description: -1 };
    } else if (args.orderBy === 'apiUrl_ASC') {
      sort = { apiUrl: 1 };
    } else {
      sort = { apiUrl: -1 };
    }
  }

  if (args.id) {
    const organizationFound = await Organization.find({
      _id: args.id,
    }).sort(sort);
    if (!organizationFound[0]) {
      throw new NotFoundError(
        requestContext.translate('organization.notFound'),
        'organization.notFound',
        'organization'
      );
    }

    return organizationFound;
  } else {
    return await Organization.find().sort(sort);
  }
};
