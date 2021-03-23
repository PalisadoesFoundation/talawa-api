const User = require("../../models/User");
const GroupChat = require("../../models/GroupChat");
const authCheck = require("../functions/authCheck");
const Organization = require("../../models/Organization");

module.exports = async (parent, args, context, info) => {
  
  authCheck(context);
  
  try{
  

  let userFound = await User.findOne({ _id: context.userId });
  if (!userFound) throw Apperror("User does not exist");

  let org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) throw Apperror("Organization not found");

  let usersInChat = [];

  
  // add users to cat
  for await (const userId of args.data.userIds) {
    //console.log(userId);
    let user = await await User.findOne({ _id: userId });
    if (!user) throw Apperror("User does not exist");
    usersInChat.push(user);
  }

  let groupChat = new GroupChat({
    creator: userFound,
    users: usersInChat,
    organization: org,
    title: args.data.title
  });

  groupChat = await groupChat.save();

  return groupChat._doc;
}catch(e){
  throw Apperror("Server error" + e, 500);
}
};
