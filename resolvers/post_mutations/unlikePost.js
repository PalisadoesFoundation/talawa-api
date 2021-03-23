const User = require("../../models/User");
const Post = require("../../models/Post");

const authCheck = require("../functions/authCheck");

const unlikePost = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw Apperror("User does not exist");

		let post = await Post.findOne({ _id: args.id });
		if (!post) {
			throw Apperror("Post not found");
		}
		if (post.likedBy.includes(context.userId)) {
			let newPost = await Post.findOneAndUpdate(
				{ _id: args.id },
				{
					$pull: {
						likedBy: context.userId,
					},
				},
				{ new: true }
			);

			return newPost;
		}
		return post;
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};

module.exports = unlikePost;
