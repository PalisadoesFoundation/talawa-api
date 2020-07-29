const User = require("../../models/User");
const Post = require("../../models/EventProject");

const authCheck = require("../functions/authCheck");

const unlikePost = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		// let post = await Post.findOne({ _id: args.id });
		// if (!post) throw new Error("Post not found");

		let newPost = Post.updateOne(
			{ id: args.id },
			{
				$pull: {
					likedBy: context.userId
				},
			},
			{ new: true }
		);
		return newPost;
	} catch (e) {
		throw e;
	}
};

module.exports = unlikePost;
