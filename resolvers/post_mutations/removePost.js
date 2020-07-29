const User = require("../../models/User");
const Post = require("../../models/Post");

const authCheck = require("../functions/authCheck");

const removePost = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		let post = await Post.findOne({ _id: args.id });
		if (!post) throw new Error("post not found");

		if (!(post.creator !== context.userId)) {
			throw new Error("User cannot delete post they didn't create");
		}

		await Post.deleteOne({ _id: args.id });
		return post;
	} catch (e) {
		throw e;
	}
};

module.exports = removePost;
