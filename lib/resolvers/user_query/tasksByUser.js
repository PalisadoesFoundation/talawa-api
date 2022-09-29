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
    } else if (args.orderBy === 'createdAt_ASC') {
      sort = { createdAt: 1 };
    } else if (args.orderBy === 'createdAt_DESC') {
      sort = { createdAt: -1 };
    } else if (args.orderBy === 'deadline_ASC') {
      sort = { deadline: 1 };
    } else {
      sort = { deadline: -1 };
    }
  }

  const user = await User.findById(args.id);
  let tasks = [];
  const orgs = {};
  for (let i = 0; i < user.createdTasks.length; i++) {
    const { tenantId, db } = await tenantCtx(user.createdTasks[i]);
    if (tenantId in orgs) continue;
    orgs[tenantId] = true;
    const { Task } = db;
    const curTasks = await Task.find({ creator: args.id })
      .sort(sort)
      .populate('event')
      .populate('creator', '-password', User);

    for (let i = 0; i < curTasks.length; i++) {
      curTasks[i]._doc._id = addTenantId(curTasks[i]._doc._id, tenantId);
      tasks.push(curTasks[i]);
    }
  }

  return tasks;
};
