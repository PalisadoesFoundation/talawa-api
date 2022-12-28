const postFilter = (filterParam) => {
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

module.exports = postFilter;
