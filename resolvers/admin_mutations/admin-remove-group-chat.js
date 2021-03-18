const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");

const Group = require("../../models/Group");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //find message
    let group = await Group.findOne({ _id: args.groupId });
    if (!group) throw new Error("Group does not exist");

    //ensure organization exists
    let org = await Organization.findOne({ _id: group._doc.organization._id });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //gets user in token - to be used later on
    let user = await User.findOne({ _id: context.userId });
    if (!user) {
      throw new Error("User does not exist");
    }

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
    await Group.deleteOne({ _id: args.groupId });

    //return user
    return {
      ...group._doc,
    };
  } catch (e) {
    throw e;
  }
};
