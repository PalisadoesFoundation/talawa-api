const User = require("../../models/User");
const Message = require("../../models/Message");
/*

    TO BE UPDATED

*/

const GroupChat = require("../../models/Message");
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

    /*

    TO BE UPDATED

    */

    //creates new Post
    let newMessage = new Message({
      ...args.data,
      creator: context.userId,
      organization: args.data.organizationId,
    });

    newMessage = await newMessage.save();

    //add creator

    return {
      ...newMessage._doc,
    };
  } catch (e) {
    throw e;
  }
};
