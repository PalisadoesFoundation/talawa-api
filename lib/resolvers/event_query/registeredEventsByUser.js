const User = require('../../models/User');
const { tenantCtx, addTenantId } = require('../../helper_functions');

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

  const user = await User.findById(args.id);
  let events = [];
  const orgs = {};
  for (let i = 0; i < user.registeredEvents.length; i++) {
    const { tenantId, db } = await tenantCtx(user.registeredEvents[i]);
    if (tenantId in orgs) continue;
    orgs[tenantId] = true;
    const { Event, Task } = db;
    const curEvents = await Event.find({
      status: 'ACTIVE',
      registrants: {
        $elemMatch: {
          userId: args.id,
          status: 'ACTIVE',
        },
      },
    })
      .sort(sort)
      .populate('creator', '-password', User)
      .populate('tasks', '', Task)
      .populate('admins', '-password', User);
    for (let i = 0; i < curEvents.length; i++) {
      curEvents[i]._doc._id = addTenantId(curEvents[i]._doc._id, tenantId);
      events.push(curEvents[i]);
    }
  }
  return events;
};
