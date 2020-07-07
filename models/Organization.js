const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const organizationSchema = new Schema({
    name: {
        type:String,
        required:true
    },
    description: {
        type:String,
        required:true
    },
    isPublic: {
        type:Boolean,
        required:true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    admins: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required:true
        }
    ],
    groupChats: [
        {
            type: Schema.Types.ObjectId,
            ref: "Message",
        }
    ],
    posts:[
        {
            type: Schema.Types.ObjectId,
            ref: "Post",
        }
    ],
    membershipRequests: [
        {
            type: Schema.Types.ObjectId,
            ref:"MembershipRequest"
        }
    ]
})

module.exports = mongoose.model("Organization", organizationSchema);
