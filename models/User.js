const mongoose = require("mongoose");
const { isEmail } = require('validator');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        validate: [ isEmail, 'invalid email' ],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdOrganizations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ],
    createdEvents: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    ],
    joinedOrganizations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ],
    registeredEvents: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    ],
    eventAdmin: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    ],
    adminFor: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ],
    membershipRequests: [
        {
            type: Schema.Types.ObjectId,
            ref:"MembershipRequest"
        }
    ]
})

module.exports = mongoose.model("User", userSchema);

