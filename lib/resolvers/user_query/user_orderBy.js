const orderByFilter = (orderBy) => {
  var sort = {};
  if (orderBy === 'id_ASC') {
    sort = {
      _id: 1,
    };
  } else if (orderBy === 'id_DESC') {
    sort = {
      _id: -1,
    };
  } else if (orderBy === 'firstName_ASC') {
    sort = {
      firstName: 1,
    };
  } else if (orderBy === 'firstName_DESC') {
    sort = {
      firstName: -1,
    };
  } else if (orderBy === 'lastName_ASC') {
    sort = {
      lastName: 1,
    };
  } else if (orderBy === 'lastName_DESC') {
    sort = {
      lastName: -1,
    };
  } else if (orderBy === 'appLanguageCode_ASC') {
    sort = {
      appLanguageCode: 1,
    };
  } else if (orderBy === 'appLanguageCode_DESC') {
    sort = {
      appLanguageCode: -1,
    };
  } else if (orderBy === 'email_ASC') {
    sort = {
      email: 1,
    };
  } else {
    sort = {
      email: -1,
    };
  }

  return sort;
};

module.exports = orderByFilter;
