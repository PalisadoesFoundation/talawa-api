const User = require("../../models/User");
const Post = require("../../models/Post");

const authCheck = require("../functions/authCheck");

const uploadImage = require("../../helper_functions/uploadImage");

module.exports = async (parent, args, context, info) => {
	//ensure user is authenticated
	authCheck(context);
	try {
		//gets user in token - to be used later on
		let userFound = await User.findOne({ _id: context.userId });
		if (!userFound) {
			throw Apperror("User does not exist");
		}
		let uploadImageObj;
		if (args.file) {
			uploadImageObj = await uploadImage(args.file, "");
		}
		//creates new Post
		let newPost = new Post({
			...args.data,
			creator: context.userId,
			organization: args.data.organizationId,
			imageUrl: args.file ? uploadImageObj.newImagePath : "",
		});

		newPost = await newPost.save();

		//add creator

		return {
			...newPost._doc,
		};
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};
