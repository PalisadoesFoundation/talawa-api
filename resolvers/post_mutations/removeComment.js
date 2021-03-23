const User = require("../../models/User");
const Comment = require("../../models/Comment");
const Post = require("../../models/Post");

const authCheck = require("../functions/authCheck");

const removeComment = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw Apperror("User does not exist");

		let comment = await Comment.findOne({ _id: args.id });
		if (!comment) throw Apperror("Comment not found");

		if (!(comment.creator !== context.userId)) {
			throw Apperror("User cannot delete comment they didn't create");
		}

		await Post.updateOne(
			{ _id: comment.post },
			{
			  $pull: {
				comments: args.id
			  },
			}
		  );

		await Comment.deleteOne({ _id: args.id });
		return comment;
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};

module.exports = removeComment;
