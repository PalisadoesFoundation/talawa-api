const model = require('../models');
const Op = require('Sequelize').Op;

exports.create_responsibility = async (req, res, next) => {
    try {
        const responsibilityCount = await model.Responsibility.count({
            where: {
                title: req.body.title
            },
            include: {
                model: model.Activity,
                where: {
                    id: req.body.activityId
                }
            }
        });
        const activityCount = await model.Activity.count({
            where: {
                id: req.body.activityId
            }
        });
        if (req.body.userId != null) {
            const userCount = await model.User.count({
                where: {
                    id: req.body.userId
                }
            });
            if (userCount == 0)
                throw 'User does not exist';
        }
        if (activityCount == 0)
            throw 'Activity does not exist'
        if (responsibilityCount > 0)
            throw 'Responsibility already exists';

        await model.Responsibility.create({
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            priority: 1,
            isCompleted: false,
            activityId: req.body.activityId,
            userId: req.body.userId
        });

        return res.status(201).json({
            message: 'Responsibility ' + req.body.title + ' successfully created'
        });

    } catch (err) {
        return res.status(409).json({
            message: err
        });

    }
}

exports.fetch_responsibilities = (req, res, next) => {
    model.Responsibility.findAll()
        .then(resps => {
            const response = {
                count: resps.length,
                Responsibilities: resps.map(resp => {
                    return {
                        id: resp.dataValues.id,
                        title: resp.dataValues.title,
                        description: resp.dataValues.description,
                        date: resp.dataValues.date.toDateString(),
                        time: resp.dataValues.date.toLocaleTimeString(),
                        priority: resp.dataValues.priority,
                        isCompleted: resp.dataValues.isCompleted
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

exports.fetch_responsibility = (req, res, next) => {
    model.Responsibility.findOne({
            where: {
                id: req.params.respId
            },
            include: [{
                    model: model.Activity
                },
                {
                    model: model.User,
                    attributes: {
                        exclude: ['password']
                    }
                }
            ]

        })
        .then(resp => {
            const response = {
                id: resp.dataValues.id,
                title: resp.dataValues.title,
                description: resp.dataValues.description,
                date: resp.dataValues.date.toDateString(),
                time: resp.dataValues.date.toLocaleTimeString(),
                priority: resp.dataValues.priority,
                isCompleted: resp.dataValues.isCompleted,
                activity: {
                    id: resp.dataValues.Activity.id,
                    title: resp.dataValues.Activity.title,
                    description: resp.dataValues.Activity.description,
                    date: resp.dataValues.Activity.date.toDateString(),
                    time: resp.dataValues.Activity.date.toLocaleTimeString(),
                },
                user: {
                    id: resp.dataValues.User.id,
                    firstName: resp.dataValues.User.firstName,
                    lastName: resp.dataValues.User.lastName,
                    email: resp.dataValues.User.email
                }
            }
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
}

exports.update_responsibility = (req, res, next) => {

    model.Responsibility.findOne({
            where: {
                id: req.params.respId
            }
        })
        .then(resp => {
            return resp.update(req.body.updates);
        })
        .then(updatedResp => {
            res.status(200).json(updatedResp);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.delete_responsibility = (req, res, next) => {
    model.Responsibility.destroy({
            where: {
                id: req.params.respId
            }
        })
        .then(doc => {
            return res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
        });
}

exports.fetch_responsibility_by_activity = (req, res, next) => {
    model.Responsibility.findAll({
            where: {
                activityId: req.params.activityId
            }
        })
        .then(resps => {
            const response = {
                count: resps.length,
                responsibilities: resps.map(resp => {
                    return {
                        id: resp.dataValues.id,
                        title: resp.dataValues.title,
                        description: resp.dataValues.description,
                        date: resp.dataValues.date.toDateString(),
                        time: resp.dataValues.date.toLocaleTimeString(),
                        priority: resp.dataValues.priority,
                        isCompleted: resp.dataValues.isCompleted,
                        activityId: resp.dataValues.activityId,
                        userId: resp.dataValues.userId
                    }
                })
            }
            return res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
        });
}