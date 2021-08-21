const Event = require('../../models/Event');

module.exports = async (parent, args) => {
  var sort = {};
  var isSortingExecuted = args.orderBy !== null;

  //Sorting List
  if (isSortingExecuted) {
    if (args.orderBy === 'id_ASC') {
      sort = { _id: 1 };
    } else if (args.orderBy === 'id_DESC') {
      sort = { _id: -1 };
    } else if (args.orderBy === 'title_ASC') {
      sort = { title: 1 };
    } else if (args.orderBy === 'title_DESC') {
      sort = { title: -1 };
    } else if (args.orderBy === 'description_ASC') {
      sort = { description: 1 };
    } else if (args.orderBy === 'description_DESC') {
      sort = { description: -1 };
    } else if (args.orderBy === 'startDate_ASC') {
      sort = { startDate: 1 };
    } else if (args.orderBy === 'startDate_DESC') {
      sort = { startDate: -1 };
    } else if (args.orderBy === 'endDate_ASC') {
      sort = { endDate: 1 };
    } else if (args.orderBy === 'endDate_DESC') {
      sort = { endDate: -1 };
    } else if (args.orderBy === 'allDay_ASC') {
      sort = { allDay: 1 };
    } else if (args.orderBy === 'allDay_DESC') {
      sort = { allDay: -1 };
    } else if (args.orderBy === 'startTime_ASC') {
      sort = { startTime: 1 };
    } else if (args.orderBy === 'startTime_DESC') {
      sort = { startTime: -1 };
    } else if (args.orderBy === 'endTime_ASC') {
      sort = { endTime: 1 };
    } else if (args.orderBy === 'endTime_DESC') {
      sort = { endTime: -1 };
    } else if (args.orderBy === 'recurrance_ASC') {
      sort = { recurrance: 1 };
    } else if (args.orderBy === 'recurrance_DESC') {
      sort = { recurrance: -1 };
    } else if (args.orderBy === 'location_ASC') {
      sort = { location: 1 };
    } else {
      sort = { location: -1 };
    }
  }

  const eventsResponse = await Event.find({ status: 'ACTIVE' })
    .sort(sort)
    .populate('creator', '-password')
    .populate('tasks')
    .populate('admins', '-password');

  return eventsResponse;
};
