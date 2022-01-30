const Organization = require('../../models/Organization');

const organizationsConnection = async (parent, args) => {
  var inputArg = {};
  var isSortingExecuted = args.orderBy !== null;
  const filterParam = args.where;

  if (filterParam) {
    //Returns provided id organizations
    if (filterParam.id) {
      inputArg = {
        ...inputArg,
        _id: filterParam.id,
      };
    }

    //Returns all organizations other than provided id
    if (filterParam.id_not) {
      inputArg = {
        ...inputArg,
        _id: { $ne: filterParam.id_not },
      };
    }

    //Return organizations with id in the provided list
    if (filterParam.id_in) {
      inputArg = {
        ...inputArg,
        _id: { $in: filterParam.id_in },
      };
    }

    //Returns organizations not included in provided id list
    if (filterParam.id_not_in) {
      inputArg = {
        ...inputArg,
        _id: { $nin: filterParam.id_not_in },
      };
    }

    //Returns provided name organization
    if (filterParam.name) {
      inputArg = {
        ...inputArg,
        name: filterParam.name,
      };
    }

    //Returns organizations with not that name
    if (filterParam.name_not) {
      inputArg = {
        ...inputArg,
        name: { $ne: filterParam.name_not },
      };
    }

    //Return organizations with the given list name
    if (filterParam.name_in) {
      inputArg = {
        ...inputArg,
        name: { $in: filterParam.name_in },
      };
    }

    //Returns organizations with name not in the provided list
    if (filterParam.name_not_in) {
      inputArg = {
        ...inputArg,
        name: { $nin: filterParam.name_not_in },
      };
    }

    //Returns organizations with name containing provided string
    if (filterParam.name_contains) {
      inputArg = {
        ...inputArg,
        name: { $regex: filterParam.name_contains, $options: 'i' },
      };
    }

    //Returns organizations with name starts with that provided string
    if (filterParam.name_starts_with) {
      const regexp = new RegExp('^' + filterParam.name_starts_with);
      inputArg = {
        ...inputArg,
        name: regexp,
      };
    }

    //Returns description organizations
    if (filterParam.description) {
      inputArg = {
        ...inputArg,
        description: filterParam.description,
      };
    }

    //Returns organizations with not that description
    if (filterParam.description_not) {
      inputArg = {
        ...inputArg,
        description: { $ne: filterParam.description_not },
      };
    }

    //Return organizations with description in provided list
    if (filterParam.description_in) {
      inputArg = {
        ...inputArg,
        description: { $in: filterParam.description_in },
      };
    }

    //Return organizations with description not in provided list
    if (filterParam.description_not_in) {
      inputArg = {
        ...inputArg,
        description: { $nin: filterParam.description_not_in },
      };
    }

    //Return organizations with description should containing provided string
    if (filterParam.description_contains) {
      inputArg = {
        ...inputArg,
        description: {
          $regex: filterParam.description_contains,
          $options: 'i',
        },
      };
    }

    //Returns organizations with description starting with provided string
    if (filterParam.description_starts_with) {
      const regexp = new RegExp('^' + filterParam.description_starts_with);
      inputArg = {
        ...inputArg,
        description: regexp,
      };
    }

    //Returns provided apiUrl organizations
    if (filterParam.apiUrl) {
      inputArg = {
        ...inputArg,
        apiUrl: filterParam.apiUrl,
      };
    }

    //Returns organizations with not that provided apiUrl
    if (filterParam.apiUrl_not) {
      inputArg = {
        ...inputArg,
        apiUrl: { $ne: filterParam.apiUrl_not },
      };
    }

    //organizations apiUrl falls in provided list
    if (filterParam.apiUrl_in) {
      inputArg = {
        ...inputArg,
        apiUrl: { $in: filterParam.apiUrl_in },
      };
    }

    //Return organizations apiUrl not falls in the list
    if (filterParam.apiUrl_not_in) {
      inputArg = {
        ...inputArg,
        apiUrl: { $nin: filterParam.apiUrl_not_in },
      };
    }

    //Return organizations with apiUrl containing provided string
    if (filterParam.apiUrl_contains) {
      inputArg = {
        ...inputArg,
        apiUrl: { $regex: filterParam.apiUrl_contains, $options: 'i' },
      };
    }

    //Returns organizations with apiUrl starts with provided string
    if (filterParam.apiUrl_starts_with) {
      const regexp = new RegExp('^' + filterParam.apiUrl_starts_with);
      inputArg = {
        ...inputArg,
        apiUrl: regexp,
      };
    }

    //Returns organizations with provided visibleInSearch condition
    if (filterParam.visibleInSearch !== undefined) {
      inputArg = {
        ...inputArg,
        visibleInSearch: filterParam.visibleInSearch,
      };
    }

    //Returns organizations with provided isPublic condition
    if (filterParam.isPublic !== undefined) {
      inputArg = {
        ...inputArg,
        isPublic: filterParam.isPublic,
      };
    }
  }

  var sort = {};
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

  const organizationFound = await Organization.find(inputArg)
    .sort(sort)
    .limit(args.first)
    .skip(args.skip);

  return organizationFound;
};

module.exports = organizationsConnection;
