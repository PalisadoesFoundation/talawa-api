const model = require('../models');

exports.create_activity = async (req, res, next) => {
    try {
        console.log(req.body)
        const activityCount = await model.Activity.count({ where: { title: req.body.title } });
        const userCount = await model.User.count({ where: { id: req.body.admin } });

        if (activityCount > 0)
            throw 'Activity already exists';
        if (userCount == 0)
            throw 'User doesnt exist';

        const activity = (await model.Activity.create({
            title: req.body.title,
            description: req.body.description,
            date: req.body.datetime
        })).dataValues;
        console.log(activity)
        await model.UserActivity.create({
            userId: req.body.admin,
            activityId: activity.id,
            isAdmin: true
        });

        req.body.users.map(async user => {
            let count = await model.User.count({ where: { id: user } });
            if (count > 0) {
                await model.UserActivity.create({
                    userId: user,
                    activityId: activity.id,
                    isAdmin: false
                }).catch(err => { throw err });
            }
        });

        return res.status(201).json({
            message: 'Activity "' + req.body.title + '" was successfully created'
        });

    } catch (err) {
        return res.status(409).json({
            message: err
        });
    }
}

exports.fetch_activities = (req, res, next) => {
    model.Activity.findAll({ include: [{ model: model.UserActivity }] })
        .then(activities => {
            const response = {
                count: activities.length,
                activities: activities.map(activity => {
                    return {
                        id: activity.dataValues.id,
                        title: activity.dataValues.title,
                        description: activity.dataValues.description,
                        datetime: activity.dataValues.date.valueOf(),
                        users: activity.dataValues.UserActivities.length
                    }
                })
            }
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        })
}

exports.fetch_activity = (req, res, next) => {
    model.Activity.findOne({
        where: {
            id: req.params.activityId
        },
        include: [
            {
                model: model.UserActivity,
                include: [{
                    model: model.User,
                    attributes: {
                        exclude: ['password']
                    }
                }]
            },
            {
                model: model.Responsibility,
            }
        ]
    })
        .then(activity => {
            const response = {
                id: activity.dataValues.id,
                title: activity.dataValues.title,
                description: activity.dataValues.description,
                datetime: activity.dataValues.date.valueOf(),
                users: activity.dataValues.UserActivities.map(UserActivity => {
                    const user = UserActivity.User;
                    return {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    }
                }),
                responsibilities: activity.dataValues.Responsibilities.map(resp => {
                    return {
                        id: resp.id,
                        title: resp.title,
                        description: resp.description,
                        datetime: resp.date.valueOf(),
                        priority: resp.priority,
                        isCompleted: resp.isCompleted
                    }
                })
            }
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
}

exports.update_activity = (req, res, next) => {

    model.Activity.findOne({ where: { id: req.params.activityId } })
        .then(activity => {
            return activity.update(req.body.updates);
        })
        .then(updatedActivity => {
            res.status(200).json(updatedActivity);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.delete_activity = (req, res, next) => {
    model.UserActivity.destroy({ where: { activityId: req.params.activityId } })
        .then(userActivity => {
            return model.Activity.destroy({ where: { id: req.params.activityId } });
        })
        .then(doc => {
            return res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.fetch_users_by_activity = (req, res, next) => {
    model.Activity.findOne({
        where: {
            id: req.params.activityId
        },
        include: [
            {
                model: model.UserActivity,
                include: [{
                    model: model.User,
                    attributes: {
                        exclude: ['password']
                    }
                }]
            }
        ]
    })
        .then(doc => {
            const response = {
                users: doc.UserActivities.map(userActivity => {
                    return userActivity.User
                })
            }
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
        })
}


exports.delete_activity = (req, res, next) => {
    model.UserActivity.destroy({ where: { activityId: req.params.activityId } })
        .then(userActivity => {
            return model.Activity.destroy({ where: { id: req.params.activityId } });
        })
        .then(doc => {
            return res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.fetch_activities_by_user = async (req, res, next) => {
    try {
        let activities = await model.Activity.findAll({
            include: {
                model: model.UserActivity,
                where: {
                    userId: req.params.userId
                }
            }
        });
        const response = {
            count: activities.length,
            activities: activities.map(activity => {
                return {
                    id: activity.dataValues.id,
                    title: activity.dataValues.title,
                    description: activity.dataValues.description,
                    datetime: activity.dataValues.date.valueOf(),
                    userCount: activity.dataValues.UserActivities.length
                }
            })
        }
        res.status(200).json(response);
    } catch (err) {
        res.status(404).json(err);
    }
}
// *Optional*
// exports.fetch_user_by_activity = (req, res, next) => {
//     model.Activity.findOne({
//         where: {
//             id: req.params.activityId
//         },
//         include: [
//             {
//                 model: model.UserActivity,
//                 include: [{
//                     model: model.User,
//                     where: {id: req.params.userId},
//                     attributes: {
//                         exclude: ['password']
//                     }
//                 }]
//             }
//         ]
//     })
//         .then(doc => {
//             const response = {
//                 users: doc.UserActivities.map(userActivity => {
//                     return userActivity.User
//                 })
//             }
//             res.status(200).json(response);
//         })
//         .catch(err => {
//             console.log(err);
//         })
// }