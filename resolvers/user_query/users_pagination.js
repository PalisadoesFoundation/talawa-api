const User = require("../../models/User");
const Apperror = require('../../error_middleware/error_handler');
const usersConnection = async (parent, args, context, info) => {
    try {
        var inputArg = {};
        var isSortingExecuted = args.orderBy != null;
        const filterParam = args.where

        if (filterParam) {
            //Returns provided id user
            if (filterParam.id) {
                inputArg = {
                    ...inputArg,
                    _id: filterParam.id
                }
            }

            //Returns all user other than provided id
            if (filterParam.id_not) {
                inputArg = {
                    ...inputArg,
                    _id: {
                        "$ne": filterParam.id_not
                    }
                }
            }

            //Return users with id in the provided list
            if (filterParam.id_in) {
                inputArg = {
                    ...inputArg,
                    _id: {
                        "$in": filterParam.id_in
                    }
                }
            }

            //Returns user not included in provided id list
            if (filterParam.id_not_in) {
                inputArg = {
                    ...inputArg,
                    _id: {
                        "$nin": filterParam.id_not_in
                    }
                }
            }

            //Returns users with id having provided string
            if (filterParam.id_contains) {
                inputArg = {
                    ...inputArg,
                    _id: {
                        "$regex": filterParam.id_contains,
                        "$options": "i"
                    }
                }
            }

            //Returns users with id starts with provided string
            if (filterParam.id_starts_with) {
                var regexp = new RegExp("^" + filterParam.id_starts_with);
                inputArg = {
                    ...inputArg,
                    _id: regexp
                }
            }

            //Returns provided firstName user
            if (filterParam.firstName) {
                inputArg = {
                    ...inputArg,
                    firstName: filterParam.firstName
                }
            }

            //Returns user with not that firstName
            if (filterParam.firstName_not) {
                inputArg = {
                    ...inputArg,
                    firstName: {
                        "$ne": filterParam.firstName_not
                    }
                }
            }

            //Return users with the given list firstName
            if (filterParam.firstName_in) {
                inputArg = {
                    ...inputArg,
                    firstName: {
                        "$in": filterParam.firstName_in
                    }
                }
            }

            //Returns users with firstName not in the provided list
            if (filterParam.firstName_not_in) {
                inputArg = {
                    ...inputArg,
                    firstName: {
                        "$nin": filterParam.firstName_not_in
                    }
                }
            }

            //Returns users with first name containing provided string
            if (filterParam.firstName_contains) {
                inputArg = {
                    ...inputArg,
                    firstName: {
                        "$regex": filterParam.firstName_contains,
                        "$options": "i"
                    }
                }
            }

            //Returns users with firstName starts with that provided string
            if (filterParam.firstName_starts_with) {
                var regexp = new RegExp("^" + filterParam.firstName_starts_with);
                inputArg = {
                    ...inputArg,
                    firstName: regexp
                }
            }

            //Returns lastName user
            if (filterParam.lastName) {
                inputArg = {
                    ...inputArg,
                    lastName: filterParam.lastName
                }
            }

            //Returns user with not that lastName
            if (filterParam.lastName_not) {
                inputArg = {
                    ...inputArg,
                    lastName: {
                        "$ne": filterParam.lastName_not
                    }
                }
            }

            //Return users with lastName in provided list
            if (filterParam.lastName_in) {
                inputArg = {
                    ...inputArg,
                    lastName: {
                        "$in": filterParam.lastName_in
                    }
                }
            }

            //Return users with lastName not in provided list
            if (filterParam.lastName_not_in) {
                inputArg = {
                    ...inputArg,
                    lastName: {
                        "$nin": filterParam.lastName_not_in
                    }
                }
            }

            //Return users with lastName should containing provided string
            if (filterParam.lastName_contains) {
                inputArg = {
                    ...inputArg,
                    lastName: {
                        "$regex": filterParam.lastName_contains,
                        "$options": "i"
                    }
                }
            }

            //Returns users with LastName starting with provided string
            if (filterParam.lastName_starts_with) {
                var regexp = new RegExp("^" + filterParam.lastName_starts_with);
                inputArg = {
                    ...inputArg,
                    lastName: regexp
                }
            }

            //Returns provided email user
            if (filterParam.email) {
                inputArg = {
                    ...inputArg,
                    email: filterParam.email
                }
            }

            //Returns user with not that provided email
            if (filterParam.email_not) {
                inputArg = {
                    ...inputArg,
                    email: {
                        "$ne": filterParam.email_not
                    }
                }
            }

            //User email falls in provided list
            if (filterParam.email_in) {
                inputArg = {
                    ...inputArg,
                    email: {
                        "$in": filterParam.email_in
                    }
                }
            }

            //Return User email not falls in the list
            if (filterParam.email_not_in) {
                inputArg = {
                    ...inputArg,
                    email: {
                        "$nin": filterParam.email_not_in
                    }
                }
            }

            //Return users with email containing provided string
            if (filterParam.email_contains) {
                inputArg = {
                    ...inputArg,
                    email: {
                        "$regex": filterParam.email_contains,
                        "$options": "i"
                    }
                }
            }

            //Returns user with email starts with provided string
            if (filterParam.email_starts_with) {
                var regexp = new RegExp("^" + filterParam.email_starts_with);
                inputArg = {
                    ...inputArg,
                    email: regexp
                }
            }
        }

        var sort = {}
        if (isSortingExecuted) {
            if (args.orderBy == "id_ASC") {
                sort = {
                    _id: 1
                }
            } else if (args.orderBy == "id_DESC") {
                sort = {
                    _id: -1
                }
            } else if (args.orderBy == "firstName_ASC") {
                sort = {
                    firstName: 1
                }
            } else if (args.orderBy == "firstName_DESC") {
                sort = {
                    firstName: -1
                }
            } else if (args.orderBy == "lastName_ASC") {
                sort = {
                    lastName: 1
                }
            } else if (args.orderBy == "lastName_DESC") {
                sort = {
                    lastName: -1
                }
            } else if (args.orderBy == "email_ASC") {
                sort = {
                    email: 1
                }
            } else {
                sort = {
                    email: -1
                }
            }
        }

        const users = await User.find(inputArg)
            .sort(sort)
            .limit(args.first)
            .skip(args.skip)
            .populate("createdOrganizations")
            .populate("createdEvents")
            .populate("joinedOrganizations")
            .populate("registeredEvents")
            .populate("eventAdmin")
            .populate("adminFor");

        return users.map((user) => {
            return {
                ...user._doc,
                password: null
            };
        });
    } catch (e) {
        throw Apperror("Server error" + e, 500);
    }
}

module.exports = usersConnection;