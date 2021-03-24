const User = require('../../models/User');
const DirectChat = require('../../models/DirectChat');
const authCheck = require('../functions/authCheck');
const Organization = require('../../models/Organization');

module.exports = async (parent, args, context) => {
  authCheck(context);

  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) throw new Error('User does not exist');

  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) throw new Error('Organization not found');

  const usersInChat = [];

  // add users to cat
  for await (const userId of args.data.userIds) {
    // console.log(userId);
    const user = await await User.findOne({ _id: userId });
    if (!user) throw new Error('User does not exist');
    usersInChat.push(user);
  }

  let directChat = new DirectChat({
    creator: userFound,
    users: usersInChat,
    organization: org,
  });

  directChat = await directChat.save();

  return directChat._doc;
};
