const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");
const Post = require("../../models/Post");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //ensure user exists
    const user = await User.findOne({ _id: args.data.userId });
    if (!user) throw new Error("User does not exist");

    //find post
    let post = await Post.findOne({_id: args.postId });
    if(!post) throw new Error("Post does not exist");

    //remove post from organization
    org.overwrite({
      ...org._doc,
      posts: org._doc.posts.filter(post=>post!=args.postId)
    });
    await org.save();

    //remove post from user
    user.overwrite({
        ...user._doc,
        posts: user._doc.posts.filter(post=>post!=args.postId)
    })
    await user.save();


    //delete post
    await Post.deleteOne({ _id: args.postId });


    //return user
    return {
        ...post._doc
    }
  } catch (e) {
    throw e;
  }
};
