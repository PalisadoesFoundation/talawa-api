const GroupChat = require("../../models/GroupChat");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const organizationExists = require("../../helper_functions/organizationExists");


module.exports = async (parent, args, context, info) => {

    try{

    authCheck(context);


    const chat = await GroupChat.findById(args.chatId);
    if (!chat) throw Apperror("Chat not found");

    const org = await organizationExists(chat.organization);

    adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future


    // ensure user is already a member
    const userAlreadyAMember = chat._doc.users.filter(user => user == args.userId);
    if (!(userAlreadyAMember.length > 0)) throw Apperror("User is not a member of this Group Chat")



    return await GroupChat.findOneAndUpdate({
        _id: args.chatId
    }, {
        $set: {
            users: chat._doc.users.filter(user => user != args.userId)
        }
    }, {
        new: true
    })
    }catch(e){
        throw Apperror("Server error" + e, 500);
    }
}