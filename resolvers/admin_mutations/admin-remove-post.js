const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const Post = require("../../models/Post");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw Apperror("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //gets user in token - to be used later on
    let user = await User.findOne({ _id: context.userId });
    if (!user) {
      throw Apperror("User does not exist" , 404);
    }

    //find post
    let post = await Post.findOne({ _id: args.postId });
    if (!post) throw Apperror("Post does not exist" , 404);

    //remove post from organization
    org.overwrite({
      ...org._doc,
      posts: org._doc.posts.filter((post) => post != args.postId),
    });
    await org.save();

    // //remove post from user
    // user.overwrite({
    //   ...user._doc,
    //   posts: user._doc.posts.filter((post) => post != args.postId),
    // });
    // await user.save();

    //delete post
    await Post.deleteOne({ _id: args.postId });

    //return user
    return {
      ...post._doc,
    };
  } catch (e) {
    throw Apperror("Server error" + e, 500);
  }
};
