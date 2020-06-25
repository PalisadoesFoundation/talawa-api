const User = require("../../models/User");
const Post = require("../../models/Post");

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
	

	//creates new Post
    let newPost = new Post({
      ...args.data,
	  creator: context.userId,
	  organization: args.data.organizationId
	});
	
    newPost = await newPost.save();



	//add creator

	return {
		...newPost._doc
	}

  } catch (e) {
    throw e;
  }
};
