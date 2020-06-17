const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    title: {
        type:String,
        required:true
    },
    description: {
        type:String,
        required:true
    },
    attendees: {
        type:String,
        required:false
    },
    isPublic: {
        type:Boolean,
        required:true
    },
    isRegisterable: {
        type: Boolean,
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    registrants: [
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
    ]
})

module.exports = mongoose.model("Event", eventSchema);
