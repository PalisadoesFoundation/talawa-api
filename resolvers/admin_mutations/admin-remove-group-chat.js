const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");
const Message = require("../../models/Message");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //find message
    let message = await Message.findOne({ _id: args.messageId });
    if (!message) throw new Error("Message does not exist");

    //remove message from organization
    org.overwrite({
      ...org._doc,
      messages: org._doc.posts.filter((message) => message != args.messageId),
    });
    await org.save();

    //remove post from user
    user.overwrite({
      ...user._doc,
      messages: user._doc.posts.filter((message) => message != args.messageId),
    });
    await user.save();

    //delete post
    await Message.deleteOne({ _id: args.postId });

    //return user
    return {
      ...message._doc,
    };
  } catch (e) {
    throw e;
  }
};
