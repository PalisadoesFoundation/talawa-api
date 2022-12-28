const eventFilter = (filterParam) => {
  var inputArg = {};
  if (filterParam.id) {
    inputArg = {
      ...inputArg,
      _id: filterParam.id,
    };
  }

  //Returns all Events other than provided id
  if (filterParam.id_not) {
    inputArg = {
      ...inputArg,
      _id: {
        $ne: filterParam.id_not,
      },
    };
  }

  //Return Events with id in the provided list
  if (filterParam.id_in) {
    inputArg = {
      ...inputArg,
      _id: {
        $in: filterParam.id_in,
      },
    };
  }

  //Returns Events not included in provided id list
  if (filterParam.id_not_in) {
    inputArg = {
      ...inputArg,
      _id: {
        $nin: filterParam.id_not_in,
      },
    };
  }

  //Returns provided text Events
  if (filterParam.description) {
    inputArg = {
      ...inputArg,
      description: filterParam.description,
    };
  }

  //Returns Events with not the provided text
  if (filterParam.description_not) {
    inputArg = {
      ...inputArg,
      description: {
        $ne: filterParam.description_not,
      },
    };
  }

  //Return Events with the given list text
  if (filterParam.description_in) {
    inputArg = {
      ...inputArg,
      description: {
        $in: filterParam.description_in,
      },
    };
  }

  //Returns Events with text not in the provided list
  if (filterParam.description_not_in) {
    inputArg = {
      ...inputArg,
      description: {
        $nin: filterParam.description_not_in,
      },
    };
  }

  //Returns Events with text containing provided string
  if (filterParam.description_contains) {
    inputArg = {
      ...inputArg,
      description: {
        $regex: filterParam.description_contains,
        $options: 'i',
      },
    };
  }

  //Returns Events with text starts with that provided string
  if (filterParam.description_starts_with) {
    const regexp = new RegExp('^' + filterParam.description_starts_with);
    inputArg = {
      ...inputArg,
      description: regexp,
    };
  }

  //Returns provided title Events
  if (filterParam.title) {
    inputArg = {
      ...inputArg,
      title: filterParam.title,
    };
  }

  //Returns Events with not that title
  if (filterParam.title_not) {
    inputArg = {
      ...inputArg,
      title: {
        $ne: filterParam.title_not,
      },
    };
  }

  //Return Events with the given list title
  if (filterParam.title_in) {
    inputArg = {
      ...inputArg,
      title: {
        $in: filterParam.title_in,
      },
    };
  }

  //Returns Events with title not in the provided list
  if (filterParam.title_not_in) {
    inputArg = {
      ...inputArg,
      title: {
        $nin: filterParam.title_not_in,
      },
    };
  }

  //Returns Events with title containing provided string
  if (filterParam.title_contains) {
    inputArg = {
      ...inputArg,
      title: {
        $regex: filterParam.title_contains,
        $options: 'i',
      },
    };
  }

  //Returns Events with title starts with that provided string
  if (filterParam.title_starts_with) {
    const regexp = new RegExp('^' + filterParam.title_starts_with);
    inputArg = {
      ...inputArg,
      title: regexp,
    };
  }

  return inputArg;
};

module.exports = eventFilter;
