const User = require("../../models/User");
const Group = require("../../models/Group");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");

module.exports = async (parent, args, context, info) => {
  //ensure user is authenticated
  authCheck(context);
  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) {
      throw new Error("User does not exist");
    }


    //creates new Group Chat
    let newGroup = new Group({
      ...args.data,
      organization:args.data.organizationId
    })

    newGroup = await newGroup.save();

    //add creator

    return {
      ...newGroup._doc,
    };
  } catch (e) {
    throw e;
  }
};
