const User = require("../../models/User");
const Post = require("../../models/Post");

const authCheck = require("../functions/authCheck");

const removePost = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw Apperror("User does not exist");

		let post = await Post.findOne({ _id: args.id });
		if (!post) throw Apperror("Post not found");

		if (!(post.creator !== context.userId)) {
			throw Apperror("User cannot delete post they didn't create");
		}

		await Post.deleteOne({ _id: args.id });
		return post;
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};

module.exports = removePost;
