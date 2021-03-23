const User = require("../../models/User");
const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const Apperror = require('../../error_middleware/error_handler');
const authCheck = require("../functions/authCheck");
module.exports = async (parent, args, context, info) => {
  //ensure user is authenticated
  authCheck(context);
  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({
      _id: context.userId
    });
    if (!userFound) {
      throw Apperror("User does not exist", 404);
    }

    let newComment = new Comment({
      ...args.data,
      creator: context.userId,
      post: args.postId
    });

    await Post.updateOne({
      _id: args.postId
    }, {
      $push: {
        comments: newComment
      },
    });


    newComment = await newComment.save();


    return {
      ...newComment._doc
    }

  } catch (e) {
    throw Apperror("server error" + e, 500);
  }
};