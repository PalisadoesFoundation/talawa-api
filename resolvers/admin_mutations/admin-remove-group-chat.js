const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");

//TO BE CHANGED TO GROUPCHAT
const GroupChat= require("../../models/Message");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //gets user in token - to be used later on
    let user = await User.findOne({ _id: context.userId });
    if (!user) {
      throw new Error("User does not exist");
    }

    //TO BE CHANGED TO GROUPCHAT

    //find message
    let groupChat = await GroupChat.findOne({ _id: args.groupChatId });
    if (!groupChat) throw new Error("Group Chat does not exist");

    //remove message from organization
    // org.overwrite({
    //   ...org._doc,
    //   messages: org._doc.posts.filter((message) => message != args.messageId),
    // });
    // await org.save();

    // //remove post from user
    // user.overwrite({
    //   ...user._doc,
    //   messages: user._doc.posts.filter((message) => message != args.messageId),
    // });
    // await user.save();

    //delete post
    await GroupChat.deleteOne({ _id: args.groupChatId });

    //return user
    return {
      ...groupChat._doc,
    };
  } catch (e) {
    throw e;
  }
};
